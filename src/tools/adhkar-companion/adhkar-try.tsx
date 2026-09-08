import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui'
import { formatNumber } from '../hijri-converter/format'
import { DHIKR, DATASET_VERSION } from './adhkar-data'
import type { AnyDhikr, DhikrFilter } from './types'
import { isCustomDhikr } from './types'
import type { ImageFrame, ImageMood } from './card-image'
import { FORMAT_EXT, type ImageFormat, type ImageResolution } from './card-image'
import { downloadBlob, formatBytes, renderSingleCard, renderSummaryCard } from './render-card-image'
import ImagePreviewDialog, { type PreviewKind } from './image-preview-dialog'
import {
  decrement,
  filterDhikr,
  increment,
  isDone,
  nextIncomplete,
  searchDhikr,
  todayProgress,
} from './engine'
import { useAdhkarVault } from './storage'

const FONT_CLASSES = {
  md: 'text-xl leading-9',
  lg: 'text-2xl leading-10',
  xl: 'text-[28px] leading-[2.75rem]',
} as const

const SET_EYEBROW: Record<DhikrFilter, { ar: string; en: string }> = {
  morning: { ar: 'أذكار الصباح', en: 'MORNING ADHKAR' },
  evening: { ar: 'أذكار المساء', en: 'EVENING ADHKAR' },
  all: { ar: 'أذكار الصباح والمساء', en: 'MORNING & EVENING ADHKAR' },
  custom: { ar: 'أذكاري', en: 'MY ADHKAR' },
}

const COUNT_CHIPS = [1, 3, 7, 10, 33, 100]

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

type WakeLockSentinel = { release: () => void }
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (mode: string) => Promise<WakeLockSentinel> }
}

function fill(template: string, vars: Record<string, string | number>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v))
  return out
}

export default function AdhkarTry() {
  const { t, locale } = useI18n()
  const a = t.adhkar
  const vault = useAdhkarVault()
  const { counts, setCount, prefs, setPrefs } = vault

  const [query, setQuery] = useState('')
  const [featuredId, setFeaturedId] = useState<string | null>(null)
  const [vibration, setVibration] = useState(false)
  const [wakeLock, setWakeLock] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [draftArabic, setDraftArabic] = useState('')
  const [draftMeaning, setDraftMeaning] = useState('')
  const [draftTarget, setDraftTarget] = useState('3')
  const [draftSet, setDraftSet] = useState<'morning' | 'evening' | 'both'>('both')
  const [frame, setFrame] = useState<ImageFrame>('portrait')
  const [mood, setMood] = useState<ImageMood>('forest')
  const [format, setFormat] = useState<ImageFormat>('png')
  const [resolution, setResolution] = useState<ImageResolution>('full')
  const [rendering, setRendering] = useState<'single' | 'today' | null>(null)
  const [imgFailed, setImgFailed] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    kind: PreviewKind
    url: string
    filename: string
    blob: Blob
    actualFormat: ImageFormat
  } | null>(null)
  const copyTimerRef = useRef<number | null>(null)
  const confirmTimerRef = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Timer + sensor cleanup on unmount.
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
      try {
        wakeLockRef.current?.release()
      } catch {
        // ignore
      }
      wakeLockRef.current = null
    }
  }, [])

  // Revoke the previous preview object URL whenever it is replaced.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  // Re-acquire the wake lock when returning to the tab.
  useEffect(() => {
    if (!wakeLock) return
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      try {
        const nav = navigator as NavigatorWithWakeLock
        nav.wakeLock
          ?.request('screen')
          .then((s) => {
            wakeLockRef.current = s
          })
          .catch(() => {
            wakeLockRef.current = null
          })
      } catch {
        wakeLockRef.current = null
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [wakeLock])

  const allItems: AnyDhikr[] = useMemo(() => [...DHIKR, ...vault.custom], [vault.custom])

  const visible = useMemo(() => {
    const filter: DhikrFilter = prefs.filter
    return searchDhikr(filterDhikr(allItems, filter), query)
  }, [allItems, prefs.filter, query])

  const progress = useMemo(() => todayProgress(visible, counts), [visible, counts])
  const allDone = visible.length > 0 && progress.done === visible.length

  const featured: AnyDhikr | null = useMemo(() => {
    if (visible.length === 0) return null
    const picked = featuredId ? visible.find((i) => i.id === featuredId) : undefined
    if (picked) return picked
    const nextId = nextIncomplete(visible, counts, null)
    return visible.find((i) => i.id === nextId) ?? visible[0]!
  }, [visible, featuredId, counts])

  const featuredCount = featured ? (counts[featured.id] ?? 0) : 0
  const num = (n: number) => formatNumber(n, prefs.digits, locale)
  const setLabel =
    prefs.filter === 'morning'
      ? a.setMorning
      : prefs.filter === 'evening'
        ? a.setEvening
        : prefs.filter === 'all'
          ? a.setAll
          : a.setCustom

  function buzz() {
    if (!vibration) return
    try {
      navigator.vibrate?.(12)
    } catch {
      // ignore — haptics unavailable
    }
  }

  /** Single counting entry point: steps, announces completion, auto-advances. */
  function step(id: string, delta: 1 | -1) {
    const item = visible.find((i) => i.id === id)
    if (!item) return
    const current = counts[id] ?? 0
    const next = delta > 0 ? increment(current, item.target) : decrement(current)
    setCount(id, next)
    if (delta > 0) {
      buzz()
      if (next >= item.target && current < item.target) {
        const title = locale === 'ar' ? item.titleAr : item.titleEn
        setStatus(fill(a.completedAnnounce, { title }))
        const nextId = nextIncomplete(visible, { ...counts, [id]: next }, id)
        if (nextId) setFeaturedId(nextId)
      }
    }
  }

  function goNext() {
    if (!featured) return
    const nextId = nextIncomplete(visible, counts, featured.id)
    if (nextId) setFeaturedId(nextId)
  }

  function goPrev() {
    if (!featured) return
    const idx = visible.findIndex((i) => i.id === featured.id)
    const prev = visible[(idx - 1 + visible.length) % visible.length]
    if (prev) setFeaturedId(prev.id)
  }

  async function toggleWakeLock(next: boolean) {
    setWakeLock(next)
    try {
      const nav = navigator as NavigatorWithWakeLock
      if (next && nav.wakeLock) {
        wakeLockRef.current = await nav.wakeLock.request('screen')
      } else {
        wakeLockRef.current?.release()
        wakeLockRef.current = null
      }
    } catch {
      wakeLockRef.current = null
    }
  }

  function armClear() {
    setConfirmClear(true)
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
    confirmTimerRef.current = window.setTimeout(() => setConfirmClear(false), 6000)
  }

  function clearEverything() {
    vault.clearAll()
    setConfirmClear(false)
    setFeaturedId(null)
    setStatus(null)
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
  }

  async function copyText(text: string) {
    setCopied(false)
    setCopyFailed(false)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopyFailed(true)
    }
  }

  function copyTodayJson() {
    const payload = {
      tool: 'adhkar-companion',
      set: prefs.filter,
      datasetVersion: DATASET_VERSION,
      generatedAt: new Date().toISOString(),
      progress: {
        done: progress.done,
        total: progress.total,
        counted: progress.counted,
        prescribed: progress.prescribed,
      },
      items: visible.map((i) => ({
        id: i.id,
        sets: i.sets.join('+'),
        count: counts[i.id] ?? 0,
        target: i.target,
        source: i.source,
        hisnRef: i.hisnRef,
        custom: isCustomDhikr(i),
      })),
      note: 'Counts measure taps, not acceptance. Arabic is authoritative; meanings are plain-language hints.',
      disclaimer:
        'Private checklist — not a fatwa. Verify wording and counts with a qualified teacher.',
    }
    void copyText(JSON.stringify(payload, null, 2))
  }

  function copyFeaturedCard() {
    if (!featured) return
    const meaning = locale === 'ar' ? featured.meaningAr : featured.meaningEn
    const text = [
      featured.arabic,
      meaning,
      `— ${featuredCount}/${featured.target} · ${featured.source} · ${featured.hisnRef} · dataset ${DATASET_VERSION}`,
      'Adhkar Companion — private checklist, not a fatwa. Arabic is authoritative.',
    ].join('\n')
    void copyText(text)
  }

  /** Renders either card to bytes. Pure w.r.t. state — values passed in so re-renders stay fresh. */
  async function renderPreviewBlob(
    kind: PreviewKind,
    frameVal: ImageFrame,
    moodVal: ImageMood,
    formatVal: ImageFormat,
    resVal: ImageResolution,
  ): Promise<{ blob: Blob; filename: string; actualFormat: ImageFormat }> {
    const eb = SET_EYEBROW[prefs.filter]
    const ext = (f: ImageFormat) => FORMAT_EXT[f]
    if (kind === 'single') {
      if (!featured) throw new Error('empty')
      const { blob, actualFormat } = await renderSingleCard({
        frame: frameVal,
        mood: moodVal,
        resolution: resVal,
        format: formatVal,
        eyebrowAr: eb.ar,
        eyebrowEn: eb.en,
        titleLine: `${featured.titleAr} · ${featured.titleEn}`,
        arabic: featured.arabic,
        countLabel: `× ${num(featured.target)}`,
        meaning: locale === 'ar' ? featured.meaningAr : featured.meaningEn,
        sourceLine: `${featured.source} · ${featured.hisnRef} · v${DATASET_VERSION}`,
        wordmark: 'waqf toolkit',
        warn1: a.imageWarnAr,
        warn2: a.imageWarnEn,
      })
      return { blob, filename: `adhkar-${featured.id}-${frameVal}-${moodVal}.${ext(actualFormat)}`, actualFormat }
    }
    if (visible.length === 0) throw new Error('empty')
    const { blob, actualFormat } = await renderSummaryCard({
      frame: frameVal,
      mood: moodVal,
      resolution: resVal,
      format: formatVal,
      eyebrowAr: eb.ar,
      eyebrowEn: eb.en,
      titleLine: a.imageTodayTitle,
      dateLine: new Date().toISOString().slice(0, 10),
      ringLabel: `${num(progress.done)}/${num(progress.total)}`,
      ringSub: fill(a.imageRingSub, { counted: num(progress.counted) }),
      rows: visible.map((i) => {
        const c = counts[i.id] ?? 0
        return {
          title: locale === 'ar' ? i.titleAr : i.titleEn,
          done: c >= i.target,
        }
      }),
      moreTemplate: a.imageMore,
      wordmark: 'waqf toolkit',
      warn1: a.imageWarnAr,
      warn2: a.imageWarnEn,
    })
    return { blob, filename: `adhkar-today-${new Date().toISOString().slice(0, 10)}-${frameVal}-${moodVal}.${ext(actualFormat)}`, actualFormat }
  }

  async function openPreview(kind: PreviewKind) {
    if (rendering) return
    if (kind === 'single' && !featured) return
    if (kind === 'today' && visible.length === 0) return
    setRendering(kind === 'single' ? 'single' : 'today')
    setImgFailed(false)
    try {
      const { blob, filename, actualFormat } = await renderPreviewBlob(kind, frame, mood, format, resolution)
      if (preview) URL.revokeObjectURL(preview.url)
      setPreview({ kind, url: URL.createObjectURL(blob), filename, blob, actualFormat })
    } catch {
      setImgFailed(true)
    } finally {
      setRendering(null)
    }
  }

  async function refreshPreview(kind: PreviewKind, frameVal: ImageFrame, moodVal: ImageMood, formatVal: ImageFormat, resVal: ImageResolution) {
    if (rendering) return
    setRendering(kind === 'single' ? 'single' : 'today')
    try {
      const { blob, filename, actualFormat } = await renderPreviewBlob(kind, frameVal, moodVal, formatVal, resVal)
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return { kind, url: URL.createObjectURL(blob), filename, blob, actualFormat }
      })
    } catch {
      setImgFailed(true)
      closePreview()
    } finally {
      setRendering(null)
    }
  }

  function closePreview() {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }

  function handleFrame(f: ImageFrame) {
    setFrame(f)
    if (preview) void refreshPreview(preview.kind, f, mood, format, resolution)
  }

  function handleMood(m: ImageMood) {
    setMood(m)
    if (preview) void refreshPreview(preview.kind, frame, m, format, resolution)
  }

  function handleFormat(f: ImageFormat) {
    setFormat(f)
    if (preview) void refreshPreview(preview.kind, frame, mood, f, resolution)
  }

  function handleResolution(r: ImageResolution) {
    setResolution(r)
    if (preview) void refreshPreview(preview.kind, frame, mood, format, r)
  }

  function submitCustom() {
    const target = Number.parseInt(draftTarget, 10)
    // The user's own words go in both locales — they wrote them, no translation involved.
    const ok = vault.addCustom({
      arabic: draftArabic,
      meaningEn: draftMeaning,
      meaningAr: draftMeaning,
      target: Number.isFinite(target) ? target : 0,
      set: draftSet,
    })
    if (ok) {
      setDraftArabic('')
      setDraftMeaning('')
      setDraftTarget('3')
      setShowCustomForm(false)
      setPrefs({ ...prefs, filter: 'custom' })
    }
  }

  const ring = featured
    ? Math.round((Math.min(featuredCount, featured.target) / featured.target) * 100)
    : 0
  const featuredDone = featured ? isDone(featuredCount, featured.target) : false

  return (
    <div className="flex flex-col gap-5">
      {/* Image export controls */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 print:hidden" role="group" aria-label={`${a.imageFrame}, ${a.imageMood}`}>
        <span className="text-[11px] font-semibold text-muted">{a.imageFrame}</span>
        <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.imageFrame}>
          {(['portrait', 'square'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={frame === f}
              onClick={() => handleFrame(f)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${FOCUS_RING} ${
                frame === f ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
              }`}
            >
              {f === 'portrait' ? a.framePortrait : a.frameSquare}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-semibold text-muted">{a.imageMood}</span>
        <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.imageMood}>
          {(['forest', 'parchment'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mood === m}
              onClick={() => handleMood(m)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${FOCUS_RING} ${
                mood === m ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
              }`}
            >
              {m === 'forest' ? a.moodForest : a.moodParchment}
            </button>
          ))}
        </div>
      </div>

      {/* Set picker */}
      <div className="flex flex-wrap items-center gap-2 print:hidden" role="group" aria-label={a.title}>
        {(['morning', 'evening', 'all', 'custom'] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={prefs.filter === s}
            onClick={() => {
              setPrefs({ ...prefs, filter: s })
              setFeaturedId(null)
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${FOCUS_RING} ${
              prefs.filter === s
                ? 'bg-accent text-paper shadow-card'
                : 'border border-line/80 bg-surface/60 text-muted hover:border-accent/40 hover:text-accent'
            }`}
          >
            {s === 'morning'
              ? a.setMorning
              : s === 'evening'
                ? a.setEvening
                : s === 'all'
                  ? a.setAll
                  : `${a.setCustom}${vault.custom.length > 0 ? ` (${num(vault.custom.length)})` : ''}`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="print:hidden">
        <label className="sr-only" htmlFor="adhkar-search">
          {a.searchPlaceholder}
        </label>
        <input
          id="adhkar-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={a.searchPlaceholder}
          dir="auto"
          className="w-full rounded-xl border border-line/80 bg-surface/70 px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10"
        />
      </div>

      {/* Display options */}
      <details className="rounded-2xl border border-line/70 px-5 py-3 print:hidden">
        <summary className={`cursor-pointer text-xs font-semibold text-muted ${FOCUS_RING} rounded`}>
          {a.displayTitle}
        </summary>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.digitsLabel}>
            {(['latn', 'arab'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={prefs.digits === d}
                onClick={() => setPrefs({ ...prefs, digits: d })}
                className={`rounded-full px-3 py-1 text-xs font-bold ${FOCUS_RING} ${
                  prefs.digits === d ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                }`}
              >
                {d === 'latn' ? a.digitsLatn : a.digitsArab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.fontLabel}>
            {(['md', 'lg', 'xl'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={prefs.fontSize === f}
                onClick={() => setPrefs({ ...prefs, fontSize: f })}
                className={`rounded-full px-3 py-1 text-xs font-bold ${FOCUS_RING} ${
                  prefs.fontSize === f ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                }`}
              >
                {f === 'md' ? a.fontSmall : f === 'lg' ? a.fontMedium : a.fontLarge}
              </button>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={vibration}
              onChange={(e) => setVibration(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {a.vibrationLabel}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={wakeLock}
              onChange={(e) => void toggleWakeLock(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {a.wakeLockLabel}
          </label>
        </div>
      </details>

      {/* Progress summary + strip */}
      <div className="print:hidden">
        <p className="mb-2 text-xs text-muted">
          {setLabel} · {fill(a.progressSummary, { done: num(progress.done), total: num(progress.total) })}
        </p>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300 motion-reduce:transition-none"
              style={{ width: `${visible.length === 0 ? 0 : Math.round((progress.done / visible.length) * 100)}%` }}
            />
          </div>
          <span dir="ltr" className="font-mono-ui text-xs font-bold text-muted">
            {num(progress.done)}/{num(progress.total)}
          </span>
        </div>
      </div>

      {status && (
        <p role="status" className="text-xs font-semibold text-accent print:hidden">
          {status}
        </p>
      )}

      {/* Featured focus card / completion / empty */}
      {allDone ? (
        <article className="glass-card overflow-hidden rounded-2xl border border-accent/50 bg-accent-soft/30 px-6 py-10 text-center print:hidden">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-paper"
          >
            ✓
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{a.completeTitle}</h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-6 text-muted">{a.completeBody}</p>
          <p dir="ltr" className="mt-3 font-mono-ui text-xs font-bold text-muted">
            {num(progress.done)}/{num(progress.total)} · {num(progress.counted)}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              variant="primary"
            onClick={() => void openPreview('today')}
            disabled={rendering !== null || visible.length === 0}
            className="px-4 py-2 text-xs"
            data-testid="button-adhkar-save-today-image"
          >
            {rendering === 'today' ? a.imageRendering : a.previewOpen}
            </Button>
            <Button variant="outline" onClick={copyTodayJson} className="px-5 py-2.5 text-xs" data-testid="button-adhkar-copy-json">
              {a.copyJson}
            </Button>
          </div>
          {imgFailed && (
            <p className="mt-3 text-xs text-red-700" role="alert">
              {a.imageFailed}
            </p>
          )}
        </article>
      ) : featured ? (
        <article className="glass-card overflow-hidden rounded-2xl border border-accent/30 print:hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line/60 px-5 py-3">
            <span className="eyebrow text-accent">
              {locale === 'ar' ? featured.titleAr : featured.titleEn}
              {isCustomDhikr(featured) ? ` · ${a.customBadge}` : ''}
            </span>
            <span dir="ltr" className="font-mono-ui text-xs text-muted">
              {num(Math.min(featuredCount, featured.target))}/{num(featured.target)}
            </span>
          </div>

          <div className="px-5 py-6 text-center sm:px-8">
            <div aria-hidden="true">
              <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24">
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-line" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="stroke-accent transition-all duration-200 motion-reduce:transition-none"
                  strokeDasharray={`${(ring / 100) * 326.7} 326.7`}
                  transform="rotate(-90 60 60)"
                />
                <text
                  x="60"
                  y="60"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-ink font-mono-ui"
                  fontSize="22"
                  fontWeight="700"
                >
                  {num(featured.target - Math.min(featuredCount, featured.target))}
                </text>
              </svg>
            </div>
            <p
              dir="rtl"
              lang="ar"
              translate="no"
              spellCheck={false}
              className={`mt-4 font-display font-medium text-ink select-text ${FONT_CLASSES[prefs.fontSize]}`}
            >
              {featured.arabic}
            </p>
            <p className="mx-auto mt-3 max-w-[60ch] text-sm leading-6 text-muted">
              {locale === 'ar' ? featured.meaningAr : featured.meaningEn}
            </p>
            <div aria-hidden="true" className="mx-auto mt-4 flex max-w-[220px] items-center gap-2">
              <span className="h-px flex-1 bg-accent/30" />
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-accent/60" />
              <span className="h-px flex-1 bg-accent/30" />
            </div>
            <p className="mt-3 font-mono-ui text-xs leading-5 text-muted" dir="ltr">
              {featured.source} · {featured.hisnRef} · v{DATASET_VERSION}
            </p>
            <div className="mt-5">
              {featuredDone ? (
                <Button variant="primary" onClick={goNext} className="px-8 py-3 text-sm">
                  {a.nextDhikr}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => step(featured.id, 1)}
                  aria-label={fill(a.tapHint, { count: featuredCount, target: featured.target })}
                  className="px-10 py-3.5 text-base"
                  data-testid="button-adhkar-count"
                >
                  {a.countAction} · {num(featured.target - featuredCount)}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 px-4 py-3">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={goPrev} className="px-4 py-2 text-xs">
                {a.prev}
              </Button>
              <Button variant="ghost" onClick={goNext} className="px-4 py-2 text-xs">
                {a.next}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => step(featured.id, -1)}
                disabled={featuredCount === 0}
                className="px-4 py-2 text-xs"
              >
                {a.undo}
              </Button>
              <Button variant="outline" onClick={copyFeaturedCard} className="px-4 py-2 text-xs" data-testid="button-adhkar-copy-card">
                {a.copyCard}
              </Button>
              <Button
                variant="outline"
                onClick={() => void openPreview('single')}
                disabled={rendering !== null}
                className="px-4 py-2 text-xs"
                data-testid="button-adhkar-save-image"
              >
                {rendering === 'single' ? a.imageRendering : a.previewOpen}
              </Button>
            </div>
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-line/70 px-5 py-8 text-center print:hidden">
          <p className="text-sm text-muted">
            {prefs.filter === 'custom' ? a.customEmpty : a.emptySearch}
          </p>
          {prefs.filter === 'custom' && (
            <Button variant="outline" onClick={() => setShowCustomForm(true)} className="mt-3 px-4 py-2 text-xs">
              {a.customShow}
            </Button>
          )}
        </div>
      )}

      {/* List: tap selects, + counts */}
      {visible.length > 0 && !allDone && (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 print:hidden">
          {visible.map((item) => {
            const c = counts[item.id] ?? 0
            const done = isDone(c, item.target)
            const active = featured?.id === item.id
            return (
              <li
                key={item.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                  active
                    ? 'border-accent/50 bg-accent-soft/40'
                    : done
                      ? 'border-line/70 bg-accent-soft/20'
                      : 'border-line/70 bg-surface/40 hover:border-accent/35'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setFeaturedId(item.id)}
                  aria-current={active ? 'true' : undefined}
                  className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-start ${FOCUS_RING}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      done ? 'border-accent bg-accent text-paper' : 'border-line text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {locale === 'ar' ? item.titleAr : item.titleEn}
                      {isCustomDhikr(item) ? ` · ${a.customBadge}` : ''}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {item.source} · ×{num(item.target)}
                    </span>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line/60">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${Math.round((Math.min(c, item.target) / item.target) * 100)}%` }}
                      />
                    </span>
                  </span>
                </button>
                <span dir="ltr" className="shrink-0 font-mono-ui text-xs text-muted">
                  {num(Math.min(c, item.target))}/{num(item.target)}
                </span>
                <button
                  type="button"
                  onClick={() => step(item.id, 1)}
                  disabled={done}
                  aria-label={`${a.countOne}: ${locale === 'ar' ? item.titleAr : item.titleEn}`}
                  className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border text-lg font-bold transition-colors disabled:cursor-default disabled:opacity-40 ${FOCUS_RING} ${
                    done
                      ? 'border-accent bg-accent text-paper'
                      : 'border-line/80 text-accent hover:border-accent hover:bg-accent-soft/40'
                  }`}
                >
                  {done ? '✓' : '+'}
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {/* Keep & share */}
      <div className="rounded-2xl border border-line/70 bg-surface/40 px-5 py-4 print:hidden">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={vault.autosave}
            onChange={(e) => {
              vault.setAutosave(e.target.checked)
              setConfirmClear(false)
            }}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-xs leading-5">
            <span className="font-semibold text-ink">{a.saveOnDevice}</span>{' '}
            <span className="text-muted">
              {a.localOnly} · {a.autosaveNote}
            </span>
          </span>
        </label>
        <p className="mt-2 text-xs leading-5 text-muted">{a.dayResetNote}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyTodayJson} className="px-4 py-2 text-xs" data-testid="button-adhkar-copy-json">
            {a.copyJson}
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="px-4 py-2 text-xs" data-testid="button-adhkar-print">
            {a.print}
          </Button>
          <Button
            variant="outline"
              onClick={() => void openPreview('today')}
              disabled={rendering !== null || visible.length === 0}
              className="px-5 py-2.5 text-xs"
              data-testid="button-adhkar-save-today-image"
            >
              {rendering === 'today' ? a.imageRendering : a.previewOpen}
          </Button>
        </div>
        {(copied || copyFailed) && (
          <p className="mt-2 text-xs" role="status">
            {copied ? a.copied : a.copyFailed}
          </p>
        )}
        {imgFailed && (
          <p className="mt-2 text-xs text-red-700" role="alert">
            {a.imageFailed}
          </p>
        )}
      </div>

      {/* Reset */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button
          variant="ghost"
          onClick={() => {
            vault.resetToday()
            setConfirmClear(false)
            setStatus(null)
          }}
          disabled={progress.counted === 0}
          className="px-4 py-2 text-xs"
        >
          {a.resetToday}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirmClear) clearEverything()
            else armClear()
          }}
          className="px-4 py-2 text-xs"
        >
          {confirmClear ? a.confirmClear : a.clearAll}
        </Button>
      </div>

      {/* Custom */}
      <div className="rounded-2xl border border-line/70 px-5 py-4 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">{a.customTitle}</h2>
          <Button variant="outline" onClick={() => setShowCustomForm((v) => !v)} className="px-4 py-2 text-xs">
            {showCustomForm ? a.customHide : a.customShow}
          </Button>
        </div>
        {showCustomForm && (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <label htmlFor="adhkar-custom-arabic" className="mb-1 block text-xs font-semibold text-ink">
                {a.customArabicLabel}
              </label>
              <textarea
                id="adhkar-custom-arabic"
                value={draftArabic}
                onChange={(e) => setDraftArabic(e.target.value)}
                placeholder={a.customArabicPlaceholder}
                dir="rtl"
                lang="ar"
                spellCheck={false}
                rows={3}
                className="w-full rounded-xl border border-line/80 bg-surface/70 px-4 py-3 text-base leading-8 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </div>
            <div>
              <label htmlFor="adhkar-custom-meaning" className="mb-1 block text-xs font-semibold text-ink">
                {a.customMeaningLabel}
              </label>
              <input
                id="adhkar-custom-meaning"
                value={draftMeaning}
                onChange={(e) => setDraftMeaning(e.target.value)}
                dir="auto"
                className="w-full rounded-xl border border-line/80 bg-surface/70 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="adhkar-custom-target" className="mb-1 block text-xs font-semibold text-ink">
                  {a.customTargetLabel}
                </label>
                <input
                  id="adhkar-custom-target"
                  value={draftTarget}
                  onChange={(e) => setDraftTarget(e.target.value)}
                  inputMode="numeric"
                  dir="ltr"
                  className="w-28 rounded-xl border border-line/80 bg-surface/70 px-4 py-2.5 font-mono-ui text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </div>
              <div>
                <span id="adhkar-chips-label" className="mb-1 block text-xs font-semibold text-ink">
                  {a.chipsLabel}
                </span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="adhkar-chips-label">
                  {COUNT_CHIPS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDraftTarget(String(n))}
                      aria-pressed={draftTarget === String(n)}
                      className={`rounded-full px-3 py-1.5 font-mono-ui text-xs font-bold ${FOCUS_RING} ${
                        draftTarget === String(n)
                          ? 'bg-accent text-paper'
                          : 'border border-line/80 text-muted hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      <span dir="ltr">{num(n)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="adhkar-custom-set" className="mb-1 block text-xs font-semibold text-ink">
                  {a.customSetLabel}
                </label>
                <select
                  id="adhkar-custom-set"
                  value={draftSet}
                  onChange={(e) => setDraftSet(e.target.value as 'morning' | 'evening' | 'both')}
                  className="rounded-xl border border-line/80 bg-surface/70 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
                >
                  <option value="morning">{a.setMorning}</option>
                  <option value="evening">{a.setEvening}</option>
                  <option value="both">{a.setBoth}</option>
                </select>
              </div>
            </div>
            {vault.customError && (
              <p className="text-xs text-red-700" role="alert">
                {a.invalidCustom}
              </p>
            )}
            <div>
              <Button variant="primary" onClick={submitCustom} className="px-5 py-2.5 text-xs">
                {a.customAdd}
              </Button>
            </div>
          </div>
        )}
        {vault.custom.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {vault.custom.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line/70 px-4 py-2.5"
              >
                <span dir="rtl" lang="ar" className="min-w-0 flex-1 truncate text-sm text-ink">
                  {c.arabic}
                </span>
                <span dir="ltr" className="shrink-0 font-mono-ui text-xs text-muted">
                  ×{num(c.target)}
                </span>
                <button
                  type="button"
                  onClick={() => vault.removeCustom(c.id)}
                  aria-label={`${a.customRemove}: ${c.arabic.slice(0, 24)}`}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-muted hover:text-red-700 ${FOCUS_RING}`}
                >
                  {a.customRemove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs leading-5 text-muted print:hidden">{a.disclaimer}</p>

      <ImagePreviewDialog
        open={preview !== null}
        title={preview?.kind === 'today' ? a.imageTodayTitle : a.previewTitle}
        imageUrl={preview?.url ?? null}
        busy={rendering !== null}
        frame={frame}
        mood={mood}
        format={format}
        resolution={resolution}
        fileSize={preview ? `≈ ${formatBytes(preview.blob.size)} · ${FORMAT_EXT[preview.actualFormat].toUpperCase()}` : null}
        fallbackNote={preview && preview.actualFormat !== format ? a.formatFallbackNote : null}
        onFrameChange={handleFrame}
        onMoodChange={handleMood}
        onFormatChange={handleFormat}
        onResolutionChange={handleResolution}
        onDownload={() => {
          if (preview) downloadBlob(preview.blob, preview.filename)
        }}
        onClose={closePreview}
      />

      {/* Print booklet — print only */}
      <div className="hidden print:block" aria-hidden="true">
        <h1 className="print:text-[18pt]">Adhkar — أذكار الصباح والمساء</h1>
        {visible.map((item) => (
          <div key={item.id} style={{ breakInside: 'avoid', marginBottom: '12px' }}>
            <p className="print:text-[12pt]">
              ☐ {locale === 'ar' ? item.titleAr : item.titleEn} — {item.target}×
            </p>
            <p className="print:text-[13pt] print:leading-9">{item.arabic}</p>
            <p className="print:text-[9pt]">
              {item.source} · {item.hisnRef} · dataset {DATASET_VERSION}
            </p>
          </div>
        ))}
        <p className="print:text-[9pt]">Generated {new Date().toISOString()} — private checklist, not a fatwa. Arabic is authoritative.</p>
      </div>
    </div>
  )
}
