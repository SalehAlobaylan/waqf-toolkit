import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n'
import { useSearch } from '@tanstack/react-router'
import { Button, Workspace } from '@/components/ui'
import { TextPicker } from './picker'
import { ToolAppBar } from '@/components/tool-app'
import { TOOL_LAYOUTS } from '@/lib/panes'
import { formatNumber } from '../hijri-converter/format'
import { HISN_DUAS } from './data/duas'
import { CURATED_QUOTES } from './data/quotes'
import { SURAHS, loadSurah, type SurahText } from './data/quran'
import { getDataset, type ReviewState } from '@/data/datasets'
import {
  canAddBlock,
  canRedo,
  canUndo,
  type Action,
  type CardDoc,
} from './engine/blocks'
import { TEMPLATES, type FrameId } from './engine/templates'
import {
  buildCardFooter,
  resolveBlocks,
  usedDatasetIds,
} from './engine/resolve'
import {
  PROJECT_FILE_EXT,
  buildJsonExport,
  buildProjectFile,
  buildTextExport,
  decodeDeepLink,
  encodeDeepLink,
  parseProjectFile,
  shareUrl,
  verifyPayload,
} from './engine/export'
import {
  FORMAT_EXT,
  downloadBlob,
  formatBytes,
  renderCard,
  renderFilename,
  renderPreview,
  renderThumbnail,
} from './render/canvas'
import { createZip } from './render/zip'
import { disposeMirror } from './render/canvas'
import { sanitizeBlocks, useCardStudioProject } from './storage'
import { printModel, printStyles, type PrintPaper } from './print'
import { MAX_BLOCKS, type CardBlock, type Digits, type ImageFormat, type ImageResolution, type ResolvedBlock } from './types'

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
let blockSequence = 0
function newBlockId(kind: string): string {
  blockSequence += 1
  return `${kind}-${Date.now().toString(36)}-${blockSequence}`
}

type StatusKey =
  | 'limit'
  | 'duplicate'
  | 'slotFull'
  | 'invalidQuote'
  | 'ayahInvalid'
  | 'copied'
  | 'copyFailed'
  | 'projectImported'
  | 'projectBad'
  | 'noQr'

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <span className="block text-[11px] font-semibold text-muted">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${FOCUS_RING} ${
              value === option.value ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CardStudioTry() {
  const { t, locale } = useI18n()
  const c = t.cardStudio
  const project = useCardStudioProject()
  const { state: history, dispatch, style, setStyle, blocks, autosave, setAutosave, clearProject } = project

  const send = useCallback((action: Action) => dispatch(action), [dispatch])


  // 23 template thumbnails are ~1340px tall in a rail, so the picker starts
  // closed; the summary names the current template so nothing is hidden.
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [provenanceOpen, setProvenanceOpen] = useState(false)
  const [quran, setQuran] = useState<Record<number, SurahText>>({})
  const [quranErrors, setQuranErrors] = useState<Record<number, boolean>>({})
  const loadingSurahs = useRef<Set<number>>(new Set())

  const [status, setStatus] = useState<StatusKey | null>(null)
  const [preview, setPreview] = useState<{ url: string; size: number } | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [previewError, setPreviewError] = useState<'overflow' | 'failed' | null>(null)
  const [illegible, setIllegible] = useState(false)
  /** Keys of blocks the engine could only fit at the type-size floor. */
  const [tightBlocks, setTightBlocks] = useState<string[]>([])
  // A 1080x1920 story card is unjudgeable in a 440px rail, so the canvas can
  // be opened in the top layer at full size. Native <dialog> for the same
  // reason Adhkar's export preview uses one: focus handling for free.
  const [previewOpen, setPreviewOpen] = useState(false)
  const expandRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = expandRef.current
    if (!dialog) return
    if (previewOpen && !dialog.open) dialog.showModal()
    if (!previewOpen && dialog.open) dialog.close()
  }, [previewOpen])
  const [downloading, setDownloading] = useState(false)
  const [includeQr, setIncludeQr] = useState(true)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [batchBusy, setBatchBusy] = useState(false)
  const [printPaper, setPrintPaper] = useState<PrintPaper>('a5')
  const [printImage, setPrintImage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const statusTimer = useRef<number | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const num = (value: number) => formatNumber(value, style.digits, locale)

  // ---- Quran loading ----
  const neededSurahs = useMemo(() => {
    const ids = new Set<number>()
    for (const block of blocks) if (block.kind === 'ayah') ids.add(block.surah)
    return [...ids]
  }, [blocks])

  // The cache lives here because the canvas needs it to resolve blocks, and
  // the picker calls `ensureSurah` to warm a surah it is about to list. In
  // flight requests are tracked so fast surah switching cannot double-fetch.
  const ensureSurah = useCallback((id: number) => {
    if (quran[id] || loadingSurahs.current.has(id)) return
    loadingSurahs.current.add(id)
    loadSurah(id)
      .then((text) => setQuran((prev) => (prev[id] ? prev : { ...prev, [id]: text })))
      .catch(() => setQuranErrors((prev) => ({ ...prev, [id]: true })))
      .finally(() => loadingSurahs.current.delete(id))
  }, [quran])

  useEffect(() => {
    for (const id of neededSurahs) ensureSurah(id)
  }, [neededSurahs, ensureSurah])

  const resolved = useMemo(
    () => resolveBlocks(blocks, { locale, digits: style.digits, quran }),
    [blocks, locale, style.digits, quran],
  )
  const footer = useMemo(() => (resolved ? buildCardFooter(resolved, locale) : ''), [resolved, locale])
  const doc: CardDoc = useMemo(() => ({ blocks, style }), [blocks, style])
  const linkPayload = useMemo(() => verifyPayload(doc), [doc])

  // ---- live preview ----
  useEffect(() => {
    if (!resolved || resolved.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear preview when empty
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return null
      })
      setPreviewError(null)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      setPreviewBusy(true)
      renderPreview({
        blocks: resolved,
        templateId: style.template,
        frame: style.frame,
        layout: style.layout,
        locale,
        footer,
        metadata: { Description: footer, Software: 'Card Studio' },
        qrPayload: includeQr ? linkPayload : null,
      })
        .then(({ blob, layout }) => {
          if (cancelled) return
          setPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev.url)
            return { url: URL.createObjectURL(blob), size: blob.size }
          })
          setPreviewError(null)
          setIllegible(!layout.legible)
          setTightBlocks(
            layout.blocks.filter((block) => !block.legible).map((block) => block.key),
          )
        })
        .catch((error: unknown) => {
          if (cancelled) return
          setPreviewError(error instanceof Error && error.message === 'layout-overflow' ? 'overflow' : 'failed')
        })
        .finally(() => {
          if (!cancelled) setPreviewBusy(false)
        })
    }, 240)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [resolved, style, locale, footer, includeQr, linkPayload])

  useEffect(() => {
    previewUrlRef.current = preview?.url ?? null
  }, [preview])

  // The print portal only exists in the browser.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only portal guard
    setMounted(true)
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (statusTimer.current) window.clearTimeout(statusTimer.current)
      disposeMirror()
    }
  }, [])

  function flash(next: StatusKey) {
    setStatus(next)
    if (statusTimer.current) window.clearTimeout(statusTimer.current)
    statusTimer.current = window.setTimeout(() => setStatus(null), 2000)
  }

  function offer(block: CardBlock) {
    const result = canAddBlock(blocks, block)
    if (!result.ok) {
      flash(result.reason)
      return
    }
    send({ type: 'add', block })
  }

  // ---- deep-link bootstrap (once) ----
  // `?b=` is validated by the tool route, so it survives client-side
  // navigation instead of only being readable on a cold load.
  const { b: shareParam } = useSearch({ from: '/$locale/tools/$slug' })
  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current || typeof window === 'undefined') return
    bootstrapped.current = true
    const param = shareParam
    if (!param) return
    const link = decodeDeepLink(param)
    if (!link) return
    // A link is untrusted input: run the same sanitizer as stored projects so a
    // crafted `?b=ayah:999:1:5000` drops the bad block instead of failing the card.
    const hydrated = sanitizeBlocks(link.blocks).map((block, index) => ({ ...block, id: `link-${index}` }))
    if (hydrated.length === 0) return
    const styleOverride: CardDoc['style'] = {
      ...style,
      template: link.template,
      layout: link.layout,
      frame: link.frame,
      digits: link.digits,
    }
    dispatch({ type: 'replace', doc: { blocks: hydrated, style: styleOverride } })
  }, [style, dispatch, shareParam])

  // ---- template thumbnails (rendered by the real engine) ----
  useEffect(() => {
    if (typeof document === 'undefined') return
    let cancelled = false
    const sample: ResolvedBlock = resolved?.[0] ?? ({
      key: 'sample',
      label: c.labelDua,
      arabic: HISN_DUAS[0]?.arabic ?? '',
      basmala: null,
      citation: HISN_DUAS[0] ? `${HISN_DUAS[0].titleEn} — ${HISN_DUAS[0].source}` : '',
      unverified: false,
      provenance: { kind: 'dua', id: 'sample', source: '', hisnRef: '' },
    } as ResolvedBlock)
    const sampleFooter = buildCardFooter([sample], locale)
    ;(async () => {
      const next: Record<string, string> = {}
      for (const template of TEMPLATES) {
        if (cancelled) return
        const dataUrl = await renderThumbnail(template, sample, sampleFooter, locale)
        if (dataUrl) next[template.id] = dataUrl
        if (cancelled) return
        setThumbnails((prev) => ({ ...prev, ...next }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [resolved, locale, c.labelDua])

  // ---- exports ----
  async function renderCurrent() {
    if (!resolved || resolved.length === 0) throw new Error('layout-overflow')
    return renderCard({
      blocks: resolved,
      templateId: style.template,
      frame: style.frame,
      layout: style.layout,
      locale,
      footer,
      format: style.format,
      scale: style.resolution === 'full' ? 2 : 1,
      metadata: { Description: footer, Software: 'Card Studio v2' },
      qrPayload: includeQr ? linkPayload : null,
    })
  }

  async function download() {
    setDownloading(true)
    try {
      const { blob, actualFormat } = await renderCurrent()
      downloadBlob(blob, renderFilename(style.template, style.frame, FORMAT_EXT[actualFormat]))
    } catch (error) {
      setPreviewError(error instanceof Error && error.message === 'layout-overflow' ? 'overflow' : 'failed')
    } finally {
      setDownloading(false)
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      flash('copied')
    } catch {
      flash('copyFailed')
    }
  }

  async function runBatch() {
    if (!resolved || resolved.length === 0) return
    setBatchBusy(true)
    try {
      const entries: { name: string; data: Uint8Array }[] = []
      for (const block of resolved) {
        // Build a single-block project reference for the QR on this card.
        const spec: CardBlock = (block.provenance.kind === 'ayah'
          ? { id: 'b', kind: 'ayah', surah: block.provenance.surah, ayahStart: block.provenance.ayahStart, ayahEnd: block.provenance.ayahEnd }
          : block.provenance.kind === 'dua'
            ? { id: 'b', kind: 'dua', duaId: block.provenance.id }
            : block.provenance.id
              ? { id: 'b', kind: 'quote', quoteId: block.provenance.id }
              : { id: 'b', kind: 'quote', manual: { text: block.arabic, author: block.provenance.author, work: block.provenance.work, locator: block.provenance.locator } })
        const single = await renderCard({
          blocks: [block],
          templateId: style.template,
          frame: style.frame,
          layout: style.layout,
          locale,
          footer,
          format: 'png',
          scale: 1,
          metadata: { Description: footer, Software: 'Card Studio v2' },
          qrPayload: includeQr ? encodeDeepLink({ blocks: [spec], style }) : null,
        })
        entries.push({
          name: `card-${String(entries.length + 1).padStart(2, '0')}.png`,
          data: new Uint8Array(await single.blob.arrayBuffer()),
        })
      }
      const zip = createZip(entries)
      downloadBlob(
        new Blob([zip as unknown as BlobPart], { type: 'application/zip' }),
        'card-studio-series.zip',
      )
    } catch {
      setPreviewError('failed')
    } finally {
      setBatchBusy(false)
    }
  }

  async function printSheet() {
    if (!resolved || resolved.length === 0) return
    try {
      const { blob } = await renderCard({
        blocks: resolved,
        templateId: style.template,
        frame: style.frame,
        layout: style.layout,
        locale,
        footer,
        format: 'png',
        scale: 2,
        metadata: { Description: footer, Software: 'Card Studio v2' },
        qrPayload: null,
      })
      setPrintImage((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
      })
      document.body.classList.add('printing-card-studio', `cs-paper-${printPaper}`)
      window.setTimeout(() => {
        window.print()
        window.setTimeout(
          () => document.body.classList.remove('printing-card-studio', `cs-paper-${printPaper}`),
          5000,
        )
      }, 80)
    } catch {
      setPreviewError('failed')
    }
  }

  function saveProject() {
    const file = buildProjectFile(doc, new Date().toISOString())
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `design${PROJECT_FILE_EXT}`)
  }

  async function openProject(file: File) {
    try {
      const parsed = parseProjectFile(JSON.parse(await file.text()))
      if ('error' in parsed) {
        flash('projectBad')
        return
      }
      dispatch({ type: 'replace', doc: parsed.doc })
      flash('projectImported')
    } catch {
      flash('projectBad')
    }
  }

  // ---- helpers ----
  const statusText: string | null = status
    ? {
        limit: c.blockLimit,
        slotFull: c.slotFull,
        duplicate: c.blockDuplicate,
        invalidQuote: c.quoteInvalid,
        ayahInvalid: c.ayahRangeInvalid,
        copied: c.copied,
        copyFailed: c.copyFailed,
        projectImported: c.projectImported,
        projectBad: c.projectBad,
        noQr: c.previewFailed,
      }[status]
    : null



  const kindLabels: Record<CardBlock['kind'], string> = {
    ayah: c.tabAyah,
    dua: c.tabDua,
    quote: c.tabQuote,
  }

  const usedDatasets = resolved ? usedDatasetIds(resolved).map((id) => getDataset(id)).filter(Boolean) : []
  const currentTemplate = TEMPLATES.find((tpl) => tpl.id === style.template)

  function blockBody(block: CardBlock): string {
    if (block.kind === 'ayah') {
      const text = quran[block.surah]
      if (!text) return '…'
      const start = Math.max(1, Math.min(block.ayahStart, block.ayahEnd))
      const end = Math.min(text.ayat.length, Math.max(block.ayahStart, block.ayahEnd))
      return text.ayat.slice(start - 1, end).join(' ')
    }
    if (block.kind === 'dua') return HISN_DUAS.find((d) => d.id === block.duaId)?.arabic ?? ''
    if ('quoteId' in block) return CURATED_QUOTES.find((q) => q.id === block.quoteId)?.arabic ?? ''
    return block.manual.text
  }

  function blockSummary(block: CardBlock): string {
    if (block.kind === 'ayah') {
      const meta = SURAHS[block.surah - 1]
      return meta ? `${locale === 'ar' ? meta.nameAr : meta.nameEn}` : ''
    }
    if (block.kind === 'dua') {
      const dua = HISN_DUAS.find((d) => d.id === block.duaId)
      return dua ? (locale === 'ar' ? dua.titleAr : dua.titleEn) : ''
    }
    if ('quoteId' in block) {
      const q = CURATED_QUOTES.find((x) => x.id === block.quoteId)
      return q ? (locale === 'ar' ? q.authorAr : q.authorEn) : ''
    }
    return block.manual.author
  }

  const reviewLabel = (state: ReviewState) =>
    state === 'verified'
      ? c.reviewVerified
      : state === 'in-review'
        ? c.reviewInReview
        : c.reviewCandidate

  const layout = TOOL_LAYOUTS['card-studio']

  return (
    <>
    <Workspace
      layout={layout}
      bleed={layout.bleed}
      bar={
        <ToolAppBar>
            <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => send({ type: 'undo' })}
              disabled={!canUndo(history)}
              className="px-3 py-1.5 text-xs"
              aria-label={c.undo}
            >
              ↶ {c.undo}
            </Button>
            <Button
              variant="ghost"
              onClick={() => send({ type: 'redo' })}
              disabled={!canRedo(history)}
              className="px-3 py-1.5 text-xs"
              aria-label={c.redo}
            >
              ↷ {c.redo}
            </Button>
            <Button variant="outline" onClick={saveProject} className="px-3 py-1.5 text-xs">
              {c.projectSave}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-xs">
              {c.projectOpen}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void openProject(file)
                event.target.value = ''
              }}
            />
            </div>
          <span className="ms-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input id="card-studio-autosave" type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
            <div>
              <label htmlFor="card-studio-autosave" className="cursor-pointer text-xs font-semibold text-ink">
                {c.saveOnDevice}
              </label>
            </div>
          </div>
          <Button variant="ghost" onClick={clearProject} disabled={blocks.length === 0} className="px-3 py-1.5 text-xs">
            {c.clearDraft}
          </Button>
          </span>
        </ToolAppBar>
      }
    >
      {/* Panel — in reading order: add content, see what you added, then
          change how it looks. Templates are last because they are a
          refinement you reach for once the words are right. */}
      <Workspace.Pane id="panel" className="space-y-5">

        <section aria-labelledby="card-studio-blocks">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="card-studio-blocks" className="text-sm font-semibold text-ink">
              {c.blocksTitle}
            </h2>
            <span dir="ltr" className="font-mono-ui text-xs text-muted">
              {num(blocks.length)}/{num(MAX_BLOCKS)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">{c.blocksHint}</p>

          {blocks.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line/80 px-4 py-6 text-center text-xs text-muted">
              {c.blocksEmpty}
            </p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {blocks.map((block, index) => (
                <li key={block.id} className="flex items-start gap-3 rounded-xl border border-line/70 bg-surface/40 px-3 py-2.5">
                  <span className="mt-0.5 shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-accent rtl:tracking-normal">
                    {kindLabels[block.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-sm font-semibold text-ink">
                        {blockSummary(block)}
                      </span>
                      {/* The engine already measured this block for the preview,
                          so the warning is free and truthful per block rather
                          than a guess from character count. */}
                      {tightBlocks.includes(block.id) && (
                        <span
                          className="shrink-0 rounded-full bg-clay-soft px-2 py-0.5 text-[10px] font-bold text-clay-deep"
                          title={c.tightFit}
                        >
                          {c.tightFit}
                        </span>
                      )}
                    </p>
                    <p dir="rtl" lang="ar" translate="no" spellCheck={false} className="mt-0.5 line-clamp-2 font-display text-sm leading-6 text-muted">
                      {blockBody(block)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => send({ type: 'move', id: block.id, delta: -1 })} disabled={index === 0} aria-label={c.blockMoveUp} className={`flex h-7 w-7 items-center justify-center rounded-full border border-line/80 text-xs text-muted hover:text-accent disabled:opacity-35 ${FOCUS_RING}`}>
                        ↑
                      </button>
                      <button type="button" onClick={() => send({ type: 'move', id: block.id, delta: 1 })} disabled={index === blocks.length - 1} aria-label={c.blockMoveDown} className={`flex h-7 w-7 items-center justify-center rounded-full border border-line/80 text-xs text-muted hover:text-accent disabled:opacity-35 ${FOCUS_RING}`}>
                        ↓
                      </button>
                    </div>
                    <button type="button" onClick={() => send({ type: 'remove', id: block.id })} aria-label={c.blockRemove} className={`flex h-7 w-7 items-center justify-center rounded-full border border-line/80 text-xs text-muted hover:text-red-700 ${FOCUS_RING}`}>
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {statusText && (
            <p role="status" className="mt-2 text-xs font-semibold text-accent">
              {statusText}
            </p>
          )}
        </section>

        <details
          className="group rounded-2xl border border-line/70"
          open={templatesOpen}
          onToggle={(event) => setTemplatesOpen(event.currentTarget.open)}
          data-testid="details-template"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span className="min-w-0 truncate">
              {c.designTitle}
              <span className="ms-2 text-xs font-normal text-muted">
                {currentTemplate
                  ? locale === 'ar'
                    ? currentTemplate.nameAr
                    : currentTemplate.nameEn
                  : ''}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 text-xs text-muted transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="border-t border-line/60 px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="card-studio-design" className="text-sm font-semibold text-ink">
              {c.designTitle}
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">{c.templateHint}</p>
          <span className="sr-only">{c.templateLabel}</span>
          <div className="mt-3 grid grid-cols-2 gap-2 @3xl:grid-cols-4" role="group" aria-label={c.templateLabel}>
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setStyle({ ...style, template: template.id })}
                aria-pressed={style.template === template.id}
                className={`overflow-hidden rounded-xl border text-start transition-colors ${FOCUS_RING} ${style.template === template.id ? 'border-accent ring-2 ring-accent/30' : 'border-line/70 hover:border-accent/40'}`}
              >
                {thumbnails[template.id] ? (
                  <img src={thumbnails[template.id]} alt="" aria-hidden="true" className="h-24 w-full object-cover" />
                ) : (
                  <span className="flex h-24 w-full items-center justify-center bg-surface/60 text-[10px] text-muted">…</span>
                )}
                <span className="block px-2 py-1.5 text-[11px] font-semibold text-ink">
                  {locale === 'ar' ? template.nameAr : template.nameEn}
                </span>
              </button>
            ))}
          </div>
          </div>
        </details>
      </Workspace.Pane>


      {/* Inspector — frame, output, and everything that leaves the tool. */}
      {/* Choosing the text is the work, so it gets the slack at every width. */}
      <Workspace.Pane id="stage">
        <TextPicker
          blocks={blocks}
          digits={style.digits}
          quran={quran}
          quranErrors={quranErrors}
          ensureSurah={ensureSurah}
          onOffer={offer}
          onRemove={(id) => send({ type: 'remove', id })}
          onStatus={flash}
          newBlockId={newBlockId}
        />
      </Workspace.Pane>

      <Workspace.Pane id="inspector" className="space-y-5">

        <div className="space-y-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="card-studio-preview" className="text-sm font-semibold text-ink">
              {c.previewTitle}
            </h2>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              data-testid="button-expand-preview"
              aria-label={c.expandPreview}
              className={`shrink-0 rounded-full border border-line/80 px-2.5 py-1 text-[10px] font-bold text-muted hover:border-accent/40 hover:text-accent ${FOCUS_RING}`}
            >
              ⤢
            </button>
          </div>
          <div className="mt-2 flex max-h-[46vh] items-center justify-center">
            {previewBusy && (
              <p className="py-10 text-center text-sm text-muted" role="status">
                {c.previewRendering}
              </p>
            )}
            {!previewBusy && previewError && (
              <p className="rounded-xl border border-clay/50 bg-clay-soft/60 px-4 py-3 text-center text-xs leading-5 text-clay-deep" role="alert">
                {previewError === 'overflow' ? c.previewOverflow : c.previewFailed}
              </p>
            )}
            {!previewBusy && !previewError && !preview && (
              <p className="rounded-xl border border-dashed border-line/80 px-4 py-8 text-center text-xs text-muted">
                {c.previewEmpty}
              </p>
            )}
            {!previewBusy && preview && (
              <div className="flex max-h-full min-w-0 flex-col items-center">
                {illegible && (
                  <p className="mb-2 rounded-xl border border-clay/50 bg-clay-soft/60 px-3 py-2 text-[11px] leading-5 text-clay-deep" role="note">
                    {c.previewIllegible}
                  </p>
                )}
                <img
                  src={preview.url}
                  alt={resolved?.map((b) => b.citation).join(' · ') ?? ''}
                  className="max-h-full w-auto max-w-full rounded-2xl border border-line/70 object-contain shadow-card"
                />
                <p dir="ltr" className="mt-2 shrink-0 text-center font-mono-ui text-[11px] text-muted">
                  {formatBytes(preview.size)}
                </p>
              </div>
            )}
          </div>
        </div>
              <section aria-labelledby="card-studio-shape">
          <h2 id="card-studio-shape" className="text-sm font-semibold text-ink">
            {c.shapeTitle}
          </h2>
  <div className="flex flex-wrap gap-x-4 gap-y-4">
            <Segmented
              label={c.frameLabel}
              value={style.frame}
              onChange={(frame) => setStyle({ ...style, frame })}
              options={[
                { value: 'square' as FrameId, label: c.frameSquare },
                { value: 'portrait' as FrameId, label: c.framePortrait },
                { value: 'story' as FrameId, label: c.frameStory },
              ]}
            />
            <Segmented
              label={c.layoutLabel}
              value={style.layout ?? 'template'}
              onChange={(value) => setStyle({ ...style, layout: value === 'template' ? null : (value as 'classic' | 'feature') })}
              options={[
                { value: 'template', label: c.layoutFollow },
                { value: 'classic', label: c.layoutEven },
                { value: 'feature', label: c.layoutFeatured },
              ]}
            />
            <Segmented
              label={c.digitsLabel}
              value={style.digits}
              onChange={(digits) => setStyle({ ...style, digits: digits as Digits })}
              options={[
                { value: 'latn', label: c.digitsLatn },
                { value: 'arab', label: c.digitsArab },
              ]}
            />
          </div>

        </section>

        <section aria-labelledby="card-studio-output">
          <h2 id="card-studio-output" className="text-sm font-semibold text-ink">
            {c.outputTitle}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Segmented
              label={c.formatLabel}
              value={style.format}
              onChange={(format) => setStyle({ ...style, format: format as ImageFormat })}
              options={[
                { value: 'png', label: c.formatPng },
                { value: 'jpeg', label: c.formatJpeg },
                { value: 'webp', label: c.formatWebp },
              ]}
            />
            <Segmented
              label={c.resolutionLabel}
              value={style.resolution}
              onChange={(resolution) => setStyle({ ...style, resolution: resolution as ImageResolution })}
              options={[
                { value: 'full', label: c.resFull },
                { value: 'compact', label: c.resCompact },
              ]}
            />
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={includeQr} onChange={(e) => setIncludeQr(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
              <span>
                {c.verifyQr}
                <span className="block text-[10px] text-muted">{c.verifyQrHint}</span>
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void download()} disabled={!resolved || resolved.length === 0 || downloading || previewError !== null} className="px-5 py-2.5 text-xs">
              {downloading ? c.previewRendering : c.downloadImage}
            </Button>
            <Button variant="outline" onClick={() => resolved && void copyText(buildTextExport(resolved, footer))} disabled={!resolved || resolved.length === 0} className="px-5 py-2.5 text-xs">
              {c.copyText}
            </Button>
            <Button variant="outline" onClick={() => resolved && void copyText(buildJsonExport({ blocks: resolved, style, footer, locale, generatedAt: new Date().toISOString() }))} disabled={!resolved || resolved.length === 0} className="px-5 py-2.5 text-xs">
              {c.copyJson}
            </Button>
            <Button variant="outline" onClick={() => void copyText(shareUrl(locale, doc))} disabled={!resolved || resolved.length === 0} className="px-5 py-2.5 text-xs">
              {c.copyLink}
            </Button>
          </div>
        </section>

        <section className="border-t border-line/60 pt-5">
          <h3 className="text-xs font-semibold text-ink">{c.printTitle}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Segmented
              label={c.printPaper}
              value={printPaper}
              onChange={(paper) => setPrintPaper(paper)}
              options={[
                { value: 'a5', label: c.paperA5 },
                { value: 'a4', label: c.paperA4 },
              ]}
            />
            <Button variant="outline" onClick={() => void printSheet()} disabled={!resolved || resolved.length === 0} className="px-4 py-2 text-xs">
              {c.printRun}
            </Button>
          </div>
        </section>

        <section className="border-t border-line/60 pt-5">
          <h3 className="text-xs font-semibold text-ink">{c.batchTitle}</h3>
          <p className="mt-1 text-[11px] leading-5 text-muted">{c.batchHint}</p>
          <Button variant="outline" onClick={() => void runBatch()} disabled={!resolved || resolved.length < 1 || batchBusy} className="mt-3 px-4 py-2 text-xs">
            {batchBusy ? c.previewRendering : c.batchRun}
          </Button>
        </section>

        <details
          className="group border-t border-line/60 pt-5"
          open={provenanceOpen}
          onToggle={(event) => setProvenanceOpen(event.currentTarget.open)}
          data-testid="details-provenance"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {c.provenanceTitle}
            <span
              aria-hidden="true"
              className="shrink-0 text-xs text-muted transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="pb-1">
          <p className="mt-1 text-[11px] leading-5 text-muted">{c.provenanceNote}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {usedDatasets.length === 0 && <li className="text-xs text-muted">{c.previewEmpty}</li>}
            {usedDatasets.map((dataset) => dataset && (
              <li key={dataset.id} className="flex items-center justify-between gap-3 text-xs">
                {/* A translation appears in the English UI only; Arabic shows
                    the Arabic name. The version is a code, so it stays as is. */}
                <span className="text-ink">
                  {locale === 'ar' ? dataset.nameAr : dataset.name}
                </span>
                <span className="flex items-center gap-2">
                  <span dir="ltr" className="font-mono-ui text-[10px] text-muted">{dataset.version}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dataset.review.state === 'verified' ? 'bg-accent-soft text-accent' : 'bg-clay-soft text-clay-deep'}`}>
                    {reviewLabel(dataset.review.state)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          </div>
        </details>

      </Workspace.Pane>
    </Workspace>
        {mounted && printImage
          ? createPortal(
              <div id="card-studio-print-portal">
                <style>{printStyles(printModel(printPaper))}</style>
                <div className="cs-print-sheet">
                  <img className="cs-print-image" src={printImage} alt="" />
                  <p className="cs-print-note">{footer}</p>
                  <p className="cs-print-note">{c.printVerifyNote}</p>
                </div>
              </div>,
              document.body,
            )
          : null}

      {/* Expanded canvas. Sized by height, not width, so a story frame keeps
          its aspect ratio instead of being letterboxed. */}
      <dialog
        ref={expandRef}
        onClose={() => setPreviewOpen(false)}
        aria-label={c.previewTitle}
        className="m-auto max-h-[92vh] w-[min(920px,94vw)] rounded-3xl border border-line/70 bg-paper p-5 backdrop:bg-ink/40"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">{c.previewTitle}</h2>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            data-testid="button-close-preview"
            className={`rounded-full border border-line/80 px-3 py-1 text-xs font-bold text-muted hover:text-accent ${FOCUS_RING}`}
          >
            ✕
          </button>
        </div>
        <div className="mt-3 flex h-[78vh] items-center justify-center">
          {preview && (
            <img
              src={preview.url}
              alt={resolved?.map((b) => b.citation).join(' · ') ?? ''}
              className="max-h-full w-auto max-w-full rounded-2xl border border-line/70 object-contain shadow-float"
            />
          )}
        </div>
      </dialog>
    </>
  )
}
