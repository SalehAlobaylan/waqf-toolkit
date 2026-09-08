import { useEffect, useRef } from 'react'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui'
import type { ImageFormat, ImageFrame, ImageMood, ImageResolution } from './card-image'

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export type PreviewKind = 'single' | 'today'

/**
 * WYSIWYG preview: shows the exact PNG bytes the exporter produced —
 * no mock, no duplicated layout. Frame/mood switches re-render live.
 */
export default function ImagePreviewDialog({
  open,
  title,
  imageUrl,
  busy,
  frame,
  mood,
  format,
  resolution,
  fileSize,
  fallbackNote,
  onFrameChange,
  onMoodChange,
  onFormatChange,
  onResolutionChange,
  onDownload,
  onClose,
}: {
  open: boolean
  title: string
  imageUrl: string | null
  busy: boolean
  frame: ImageFrame
  mood: ImageMood
  format: ImageFormat
  resolution: ImageResolution
  fileSize: string | null
  fallbackNote: string | null
  onFrameChange: (f: ImageFrame) => void
  onMoodChange: (m: ImageMood) => void
  onFormatChange: (f: ImageFormat) => void
  onResolutionChange: (r: ImageResolution) => void
  onDownload: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const a = t.adhkar
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      try {
        dialog.showModal()
      } catch {
        // older browser — dialog renders non-modal
      }
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Move focus to Download once the preview is ready.
  useEffect(() => {
    if (open && imageUrl && !busy) {
      dialogRef.current
        ?.querySelector<HTMLElement>('[data-testid="button-adhkar-preview-download"]')
        ?.focus()
    }
  }, [open, imageUrl, busy])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="adhkar-preview-title"
      onClose={onClose}
      className="glass-panel max-h-[92vh] w-[min(560px,94vw)] overflow-y-auto rounded-[24px] border border-line/70 p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line/60 px-5 py-3">
        <h2 id="adhkar-preview-title" className="font-display text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={a.previewClose}
          className={`rounded-full border border-line/80 px-3 py-1 text-xs font-bold text-muted hover:text-accent ${FOCUS_RING}`}
        >
          ✕
        </button>
      </div>

      <div className="px-5 py-4">
        {busy || !imageUrl ? (
          <p className="py-16 text-center text-sm text-muted" role="status">
            {a.imageRendering}
          </p>
        ) : (
          <img
            src={imageUrl}
            alt={title}
            className="mx-auto h-auto max-h-[52vh] w-auto max-w-full rounded-xl shadow-float"
          />
        )}
        <p className="mt-3 text-center text-[11px] leading-5 text-muted">{a.previewHint}</p>
        {fileSize && (
          <p className="mt-1 text-center font-mono-ui text-[11px] text-muted" dir="ltr">
            {fileSize}
          </p>
        )}
        {fallbackNote && (
          <p className="mt-1 text-center text-[11px] text-muted" role="note">
            {fallbackNote}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.imageFrame}>
            {(['portrait', 'square'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={frame === f}
                disabled={busy}
                onClick={() => onFrameChange(f)}
                className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${FOCUS_RING} ${
                  frame === f ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                }`}
              >
                {f === 'portrait' ? a.framePortrait : a.frameSquare}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.imageMood}>
            {(['forest', 'parchment'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mood === m}
                disabled={busy}
                onClick={() => onMoodChange(m)}
                className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${FOCUS_RING} ${
                  mood === m ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                }`}
              >
                {m === 'forest' ? a.moodForest : a.moodParchment}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.imageFormat}>
            {(['png', 'jpeg', 'webp'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={format === f}
                disabled={busy}
                onClick={() => onFormatChange(f)}
                dir="ltr"
                className={`rounded-full px-3 py-1 font-mono-ui text-xs font-bold disabled:opacity-50 ${FOCUS_RING} ${
                  format === f ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                }`}
              >
                {f === 'png' ? a.formatPng : f === 'jpeg' ? a.formatJpeg : a.formatWebp}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-line/80 p-1" role="group" aria-label={a.imageResolution}>
            {(['full', 'compact'] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={resolution === r}
                disabled={busy}
                onClick={() => onResolutionChange(r)}
                className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${FOCUS_RING} ${
                  resolution === r ? 'bg-accent text-paper' : 'text-muted hover:text-accent'
                }`}
              >
                {r === 'full' ? a.resFull : a.resCompact}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-line/60 px-5 py-3">
        <Button variant="ghost" onClick={onClose} className="px-4 py-2 text-xs">
          {a.previewClose}
        </Button>
        <Button
          variant="primary"
          onClick={onDownload}
          disabled={busy || !imageUrl}
          className="px-5 py-2 text-xs"
          data-testid="button-adhkar-preview-download"
        >
          {a.previewDownload}
        </Button>
      </div>
    </dialog>
  )
}
