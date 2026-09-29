/**
 * Canvas renderer for Card Studio V2.
 *
 * It draws the *measured* layout: each Arabic line is placed word-by-word at
 * the positions the layout engine computed, distributing justification slack
 * between words (never inside them). Guarantees:
 * - Throws `layout-overflow` rather than exporting a clipped text.
 * - Same input → same bytes (pinned palettes, no randomness).
 * - Provenance is embedded in the PNG (Description + Software) and the QR
 *   carries the deep link.
 */

import {
  FORMAT_EXT,
  downloadBlob,
  formatBytes,
  hasArabic,
  pickFormat,
  supportedFormats,
  toBlob,
  type ImageFormat,
} from '@/lib/image-export'
import type { Locale } from '@/i18n'
import {
  arabicFont,
  citationFont,
  labelFont,
  layoutCard,
  type CardLayout,
  type MeasuredLine,
} from '../engine/layout'
import type { Measurer } from '../engine/linebreak'
import { createDomMirror, createStubMeasure, type DomMirror } from '../engine/measure'
import { getTemplate, type FrameId, type Template } from '../engine/templates'
import { getPalette, type CardPalette } from './palette'
import { drawBackground } from './patterns'
import { drawDivider, drawFrame, drawOrnamentSet } from './ornaments'
import { drawQr, encodeQr } from './qr'
import { embedPngBlob } from './png-meta'
import type { ResolvedBlock } from '../types'

export { FORMAT_EXT, downloadBlob, formatBytes, supportedFormats }

export type CardRenderOptions = {
  blocks: ResolvedBlock[]
  templateId: string
  frame: FrameId
  /** Layout variant override; null follows the template. */
  layout?: 'classic' | 'feature' | null
  locale: Locale
  footer: string
  format: ImageFormat
  /** 1 = compact (preview), 2 = full resolution. */
  scale: 1 | 2
  /** Optional provenance JSON embedded in the PNG. */
  metadata?: Record<string, string>
  /** Optional QR payload (deep link). Null disables the QR. */
  qrPayload?: string | null
}

export type RenderedCard = {
  blob: Blob
  actualFormat: ImageFormat
  layout: CardLayout
  qrVersion: number | null
}

let mirror: DomMirror | null = null

function getMirror(): Measurer {
  if (typeof document === 'undefined') return createStubMeasure()
  if (!mirror) mirror = createDomMirror()
  return mirror
}

export function disposeMirror() {
  mirror?.dispose()
  mirror = null
}

const FONT_TIMEOUT_MS = 3000
const REQUIRED_FONTS = [
  '400 64px "Amiri"',
  '700 64px "Amiri"',
  '500 44px "Thmanyah Display"',
  '400 34px "Thmanyah Sans"',
  '500 30px "DM Sans"',
  '700 30px "Space Mono"',
]

async function ensureFonts() {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  await Promise.race([
    Promise.all(REQUIRED_FONTS.map((font) => document.fonts.load(font).catch(() => []))),
    new Promise((resolve) => window.setTimeout(resolve, FONT_TIMEOUT_MS)),
  ])
  // Clear cached measurements so the first layout uses real font metrics.
  await mirror?.load(REQUIRED_FONTS)
}

function tracked(ctx: CanvasRenderingContext2D, value: string, str: string) {
  try {
    ;(ctx as unknown as Record<string, unknown>).letterSpacing =
      value !== '0px' && hasArabic(str) ? '0px' : value
  } catch {
    // older canvas
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  font: string,
  color: string,
  opts?: { align?: CanvasTextAlign; dir?: CanvasDirection; spacing?: string },
) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = opts?.align ?? 'center'
  ctx.textBaseline = 'alphabetic'
  try {
    ctx.direction = opts?.dir ?? 'inherit'
  } catch {
    // ignore
  }
  if (opts?.spacing) tracked(ctx, opts.spacing, str)
  ctx.fillText(str, x, y)
  if (opts?.spacing) tracked(ctx, '0px', '')
}

/**
 * Draw one Arabic line word-by-word, distributing the measured slack between
 * words when justified. `justify` centers a single word instead of stretching.
 */
function drawArabicLine(
  ctx: CanvasRenderingContext2D,
  line: MeasuredLine,
  centerX: number,
  baseline: number,
  font: string,
  color: string,
  justify: boolean,
) {
  const words = line.words
  if (words.length === 0) return
  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = 'alphabetic'
  try {
    ctx.direction = 'rtl'
  } catch {
    // ignore
  }
  const spaceWidth = ctx.measureText(' ').width || 0

  // Justification distributes the measured slack *between* words; it never
  // touches a letter, so the rendered string stays byte-identical to the source.
  let extra = 0
  if (justify && words.length > 1 && line.slack > 0) {
    extra = Math.min(line.slack, spaceWidth * 2.5 * (words.length - 1)) / (words.length - 1)
  }
  const total = line.width + extra * (words.length - 1)
  // Arabic reads right to left: start at the right edge and walk leftwards.
  let right = centerX + total / 2
  ctx.textAlign = 'right'
  for (const word of words) {
    const w = word.width || ctx.measureText(word.text).width
    ctx.fillText(word.text, right, baseline)
    right -= w + spaceWidth + extra
  }
}

function drawMetadataLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  baselines: number[],
  centerX: number,
  fontFor: (size: number) => string,
  size: number,
  color: string,
  locale: Locale,
  rtl: boolean,
) {
  lines.forEach((line, index) => {
    drawText(ctx, line, centerX, baselines[index]!, fontFor(size), color, {
      dir: rtl ? 'rtl' : 'ltr',
    })
  })
}

function prepareCanvas(w: number, h: number, scale: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('render-failed')
  ctx.scale(scale, scale)
  return { canvas, ctx }
}

async function paint(
  opts: CardRenderOptions,
  measure: Measurer,
  scale: number,
): Promise<{
  ctx: CanvasRenderingContext2D
  layout: CardLayout
  w: number
  h: number
  palette: CardPalette
  template: Template
  qrVersion: number | null
}> {
  const template = getTemplate(opts.templateId)
  await ensureFonts()
  const qrSize = opts.frame === 'story' ? 150 : 120
  const layout = layoutCard(measure, {
    blocks: opts.blocks,
    frame: opts.frame,
    template,
    layout: opts.layout ?? null,
    locale: opts.locale,
    footer: opts.footer,
    footerReserve: opts.qrPayload ? qrSize + 56 : 0,
  })
  if (!layout.fits) throw new Error('layout-overflow')

  const palette = getPalette(template.palette)
  const { w, h } = layout
  const { ctx } = prepareCanvas(w, h, scale)

  drawBackground(ctx, template.background, w, h, layout.inset, palette)
  drawFrame(ctx, w, h, layout.inset, palette.frame, palette.frameInner)
  drawOrnamentSet(ctx, template.ornaments, w, h, layout.inset, layout.ornamentY, palette.ornament)

  for (const block of layout.blocks) {
    drawText(
      ctx,
      block.label,
      w / 2,
      block.labelBaseline,
      labelFont(opts.locale, block.labelSize),
      palette.label,
      opts.locale === 'en' ? { dir: 'ltr', spacing: '6px' } : { dir: 'rtl' },
    )

    block.basmalaBaselines.forEach((baseline, index) => {
      const line = block.basmalaLines[index]
      if (!line) return
      drawArabicLine(
        ctx,
        line,
        w / 2,
        baseline,
        arabicFont(block.basmalaSize, 400, template.fonts.display),
        palette.ink,
        true,
      )
    })

    const bodyFont = arabicFont(block.arabicSize, 400, template.fonts.body)
    block.arabicLines.forEach((line, index) => {
      const isLast = index === block.arabicLines.length - 1
      drawArabicLine(
        ctx,
        line,
        w / 2,
        block.arabicBaselines[index]!,
        bodyFont,
        palette.ink,
        !isLast,
      )
    })

    drawMetadataLines(
      ctx,
      block.citationLines,
      block.citationBaselines,
      w / 2,
      (size) => citationFont(opts.locale, size),
      block.citationSize,
      palette.citation,
      opts.locale,
      opts.locale === 'ar',
    )
  }

  for (const y of layout.dividers) drawDivider(ctx, w, y, palette.divider)

  drawMetadataLines(
    ctx,
    layout.footerLines,
    layout.footerLines.map((_, index) => layout.footerY + index * layout.footerSize * 1.5),
    layout.footerX,
    (size) => citationFont(opts.locale, size),
    layout.footerSize,
    palette.footer,
    opts.locale,
    opts.locale === 'ar',
  )

  // QR "verify at source", bottom-end corner.
  let qrVersion: number | null = null
  if (opts.qrPayload) {
    const qr = encodeQr(opts.qrPayload)
    if (qr) {
      qrVersion = qr.version
      // Bottom-start corner, inside the frame, clear of the reserved footer band.
      drawQr(
        ctx,
        qr,
        layout.inset + 4,
        h - qrSize - layout.inset + 24,
        qrSize,
        palette.ink,
        palette.bg,
      )
    }
  }

  return { ctx, layout, w, h, palette, template, qrVersion }
}

export async function renderCard(opts: CardRenderOptions): Promise<RenderedCard> {
  const measure = getMirror()
  const painted = await paint(opts, measure, opts.scale)
  const actualFormat = pickFormat(opts.format, supportedFormats())
  let blob = await toBlob(painted.ctx.canvas, actualFormat)
  if (actualFormat === 'png' && opts.metadata) {
    blob = await embedPngBlob(blob, opts.metadata)
  }
  return { blob, actualFormat, layout: painted.layout, qrVersion: painted.qrVersion }
}

/** Small preview (compact scale) for the live canvas. */
export async function renderPreview(opts: Omit<CardRenderOptions, 'scale' | 'format'>): Promise<RenderedCard> {
  return renderCard({ ...opts, scale: 1, format: 'png' })
}

/** 270px template thumbnail rendered from the real engine. */
export async function renderThumbnail(
  template: Template,
  sampleBlock: ResolvedBlock,
  footer: string,
  locale: Locale,
): Promise<string | null> {
  const scale = 0.25 // 1080 * 0.25 = 270
  const measure = getMirror()
  try {
    const painted = await paint(
      {
        blocks: [sampleBlock],
        templateId: template.id,
        frame: 'square',
        locale,
        footer,
        format: 'png',
        scale: 1,
        qrPayload: null,
      },
      measure,
      scale,
    )
    return painted.ctx.canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export function renderFilename(templateId: string, frame: FrameId, ext: string): string {
  return `card-${templateId}-${frame}.${ext}`
}
