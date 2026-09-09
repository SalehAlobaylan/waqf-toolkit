import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui'
import { formatNumber } from '../hijri-converter/format'
import { DHIKR, DATASET_VERSION } from './adhkar-data'
import type { AnyDhikr, DhikrFilter } from './types'
import { isCustomDhikr } from './types'
import type { ImageFrame, ImageMood } from './card-image'
import { FORMAT_EXT, type ImageFormat, type ImageResolution } from './card-image'
import { downloadBlob, formatBytes, renderSingleCard } from './render-card-image'
import { printModel, type PrintLayout } from './print-model'
import ImagePreviewDialog from './image-preview-dialog'
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

function fill(template: string | undefined, vars: Record<string, string | number>): string {
  // Never white-screen on a missing i18n key: degrade to the raw template.
  if (typeof template !== 'string') return ''
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
  const [rendering, setRendering] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [exportDuaaId, setExportDuaaId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client gate for the print portal
    setMounted(true)
    const afterPrint = () => document.body.classList.remove('printing-adhkar', 'paper-a5')
    window.addEventListener('afterprint', afterPrint)
    return () => {
      window.removeEventListener('afterprint', afterPrint)
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

  function printBooklet() {
    document.body.classList.add('printing-adhkar')
    if (prefs.printPaper === 'a5') document.body.classList.add('paper-a5')
    // Let classes apply before the snapshot, then clean up even if afterprint misfires.
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => document.body.classList.remove('printing-adhkar', 'paper-a5'), 5000)
    }, 60)
  }

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

  const booklet = useMemo(
    () =>
      printModel(visible, {
        setName: setLabel,
        dateISO: new Date().toISOString().slice(0, 10),
        locale,
        meanings: prefs.printMeanings,
        sources: prefs.printSources,
        cover: prefs.printCover,
        layout: prefs.printLayout,
      }),
    [visible, setLabel, prefs.printMeanings, prefs.printSources, prefs.printCover, prefs.printLayout, locale],
  )

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
      note: a.exportNote,
      disclaimer: a.disclaimer,
    }
    void copyText(JSON.stringify(payload, null, 2))
  }

  function copyFeaturedCard() {
    if (!featured) return
    const meaning = locale === 'ar' ? featured.meaningAr : featured.meaningEn
    const text = [
      featured.arabic,
      meaning,
      `— ${featuredCount}/${featured.target} · ${featured.source} · ${featured.hisnRef} · ${fill(a.datasetVersion, { v: DATASET_VERSION })}`,
      a.disclaimer,
    ].join('\n')
    void copyText(text)
  }

  /** Renders the chosen duaa to bytes. Values passed in so re-renders stay fresh. */
  async function renderExportBlob(
    duaaId: string,
    frameVal: ImageFrame,
    moodVal: ImageMood,
    formatVal: ImageFormat,
    resVal: ImageResolution,
  ): Promise<{ blob: Blob; filename: string; actualFormat: ImageFormat }> {
    const item = allItems.find((i) => i.id === duaaId)
    if (!item) throw new Error('empty')
    const eb = SET_EYEBROW[prefs.filter]
    const isAr = locale === 'ar'
    const { blob, actualFormat } = await renderSingleCard({
      frame: frameVal,
      mood: moodVal,
      resolution: resVal,
      format: formatVal,
      eyebrow: isAr ? eb.ar : eb.en,
      eyebrowRtl: isAr,
      titleLine: isAr ? item.titleAr : item.titleEn,
      arabic: item.arabic,
    })
    return { blob, filename: `adhkar-${item.id}-${frameVal}-${moodVal}.${FORMAT_EXT[actualFormat]}`, actualFormat }
  }

  async function openExport(duaaId: string | null) {
    const id = duaaId ?? featured?.id ?? visible[0]?.id
    if (!id || rendering) return
    setExportDuaaId(id)
    setRendering(true)
    setImgFailed(false)
    try {
      const { blob, filename, actualFormat } = await renderExportBlob(id, frame, mood, format, resolution)
      if (preview) URL.revokeObjectURL(preview.url)
      setPreview({ url: URL.createObjectURL(blob), filename, blob, actualFormat })
    } catch {
      setImgFailed(true)
      setExportDuaaId(null)
    } finally {
      setRendering(false)
    }
  }

  async function refreshExport(
    duaaId: string,
    frameVal: ImageFrame,
    moodVal: ImageMood,
    formatVal: ImageFormat,
    resVal: ImageResolution,
  ) {
    if (rendering) return
    setRendering(true)
    try {
      const { blob, filename, actualFormat } = await renderExportBlob(duaaId, frameVal, moodVal, formatVal, resVal)
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return { url: URL.createObjectURL(blob), filename, blob, actualFormat }
      })
    } catch {
      setImgFailed(true)
      closeExport()
    } finally {
      setRendering(false)
    }
  }

  function closeExport() {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
    setExportDuaaId(null)
  }

  function refreshOpenExport(
    duaaId: string,
    frameVal: ImageFrame,
    moodVal: ImageMood,
    formatVal: ImageFormat,
    resVal: ImageResolution,
  ) {
    void refreshExport(duaaId, frameVal, moodVal, formatVal, resVal)
  }

  function handleFrame(f: ImageFrame) {
    setFrame(f)
    if (exportDuaaId) refreshOpenExport(exportDuaaId, f, mood, format, resolution)
  }

  function handleMood(m: ImageMood) {
    setMood(m)
    if (exportDuaaId) refreshOpenExport(exportDuaaId, frame, m, format, resolution)
  }

  function handleFormat(f: ImageFormat) {
    setFormat(f)
    if (exportDuaaId) refreshOpenExport(exportDuaaId, frame, mood, f, resolution)
  }

  function handleResolution(r: ImageResolution) {
    setResolution(r)
    if (exportDuaaId) refreshOpenExport(exportDuaaId, frame, mood, format, r)
  }

  function handleSelectDuaa(id: string) {
    setExportDuaaId(id)
    refreshOpenExport(id, frame, mood, format, resolution)
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
            onClick={() => void openExport(null)}
            disabled={rendering || visible.length === 0}
            className="px-4 py-2 text-xs"
            data-testid="button-adhkar-export-image"
          >
            {rendering ? a.imageRendering : a.exportImage}
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
                onClick={() => featured && void openExport(featured.id)}
                disabled={rendering || !featured}
                className="px-4 py-2 text-xs"
                data-testid="button-adhkar-export-image"
              >
                {rendering ? a.imageRendering : a.exportImage}
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
        <div className="mt-3 border-t border-line/60 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[11px] font-semibold text-muted">{a.printLayout}</span>
            <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.printLayout}>
              {(['booklet', 'checklist'] as const satisfies PrintLayout[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={prefs.printLayout === l}
                  onClick={() => setPrefs({ ...prefs, printLayout: l })}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${FOCUS_RING} ${
                    prefs.printLayout === l ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                  }`}
                >
                  {l === 'booklet' ? a.layoutBooklet : a.layoutChecklist}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-muted">{a.printPaper}</span>
            <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.printPaper}>
              {(['a4', 'a5'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={prefs.printPaper === p}
                  onClick={() => setPrefs({ ...prefs, printPaper: p })}
                  dir="ltr"
                  className={`rounded-full px-3 py-1 font-mono-ui text-xs font-bold ${FOCUS_RING} ${
                    prefs.printPaper === p ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-muted">{a.printCover}</span>
            <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.printCover}>
              {(['band', 'light'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={prefs.printCover === c}
                  onClick={() => setPrefs({ ...prefs, printCover: c })}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${FOCUS_RING} ${
                    prefs.printCover === c ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                  }`}
                >
                  {c === 'band' ? a.coverBand : a.coverLight}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-muted">{a.paperA5Hint}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.printMeanings}
                onChange={(e) => setPrefs({ ...prefs, printMeanings: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              {a.printMeanings}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.printSources}
                onChange={(e) => setPrefs({ ...prefs, printSources: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              {a.printSources}
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyTodayJson} className="px-4 py-2 text-xs" data-testid="button-adhkar-copy-json">
            {a.copyJson}
          </Button>
          <Button variant="outline" onClick={printBooklet} className="px-4 py-2 text-xs" data-testid="button-adhkar-print">
            {a.print}
          </Button>
          <Button
            variant="outline"
              onClick={() => void openExport(null)}
              disabled={rendering || visible.length === 0}
              className="px-5 py-2.5 text-xs"
              data-testid="button-adhkar-export-image"
            >
              {rendering ? a.imageRendering : a.exportImage}
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
        open={exportDuaaId !== null}
        items={allItems.map((i) => ({
          id: i.id,
          title: locale === 'ar' ? i.titleAr : i.titleEn,
          countLabel: `×${num(i.target)}`,
        }))}
        selectedId={exportDuaaId}
        onSelect={handleSelectDuaa}
        imageUrl={preview?.url ?? null}
        busy={rendering}
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
        onClose={closeExport}
      />

      {/* Print booklet — portalled to <body> so only it reaches paper */}
      {mounted &&
        createPortal(
          <div id="adhkar-print-portal" aria-hidden="true">
            <div className="hidden print:block">
              <div
                className={booklet.cover === 'band' ? 'pb-cover-band' : 'pb-cover-light'}
                style={{ padding: '12mm 10mm', marginBottom: '8mm' }}
              >
                <p className="pb-micro" dir="ltr" style={{ fontSize: '9pt', margin: 0, opacity: 0.85 }}>
                  {booklet.dateISO} · {fill(a.datasetVersion, { v: booklet.datasetVersion })}
                </p>
                <h1 className="pb-title" style={{ fontSize: '26pt', lineHeight: 1.4, margin: '3mm 0 0' }}>
                  {booklet.setName}
                </h1>
                <p style={{ fontSize: '11pt', margin: '3mm 0 0' }}>
                  {fill(a.printCount, { count: num(booklet.count) })} · {a.printCoverPrivate}
                </p>
              </div>
              {booklet.layout === 'checklist' ? (
          <div className="pb-checklist">
            {booklet.rows.map((row) => (
              <p key={row.id} style={{ fontSize: '11pt', margin: '0 0 3mm', display: 'flex', alignItems: 'center', gap: '3mm' }}>
                <span className="pb-box" />
                <span>{row.title} — <span dir="ltr">{num(row.target)}×</span></span>
              </p>
            ))}
          </div>
        ) : (
          <div>
            {booklet.rows.map((row, i) => (
              <div key={row.id}>
                <div className="pb-avoid pb-card" style={{ marginBottom: '6mm', paddingInlineStart: '4mm', paddingTop: '1mm' }}>
                  <p style={{ fontSize: '12pt', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '3mm' }}>
                    <span className="pb-box" />
                    <span>{row.title} — <span dir="ltr">{num(row.target)}×</span></span>
                  </p>
                  <p className="pb-arabic" lang="ar" style={{ fontSize: '15pt', margin: '3mm 0 0' }}>
                    {row.arabic}
                  </p>
                  {row.meaning !== '' && (
                    <p style={{ fontSize: '10pt', margin: '2mm 0 0' }}>{row.meaning}</p>
                  )}
                        {row.source !== '' && (
                          <p className="pb-micro" dir="ltr" style={{ fontSize: '8pt', marginTop: '2mm', opacity: 0.75 }}>
                            {row.source} · {fill(a.datasetVersion, { v: booklet.datasetVersion })}
                          </p>
                        )}
                </div>
                {i < booklet.rows.length - 1 && (
                  <div className="pb-rule" aria-hidden="true" style={{ margin: '0 0 6mm' }}>
                    <span className="pb-diamond" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: '10mm', textAlign: 'center' }}>
          <div className="pb-rule" aria-hidden="true">
            <span className="pb-diamond" />
          </div>
          <p className="pb-micro" dir="ltr" style={{ fontSize: '8pt', marginTop: '4mm' }}>
            {booklet.dateISO} · adhkar-companion v{booklet.datasetVersion} · {a.printVerify}
          </p>
        </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
