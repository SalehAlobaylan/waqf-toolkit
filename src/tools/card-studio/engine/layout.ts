/**
 * Pure multi-block layout for Card Studio V2.
 *
 * Design notes:
 * - No DOM, no canvas: callers inject a `Measurer`. The renderer draws these
 *   exact boxes, so what is measured is what ships.
 * - Arabic text is never sliced and never modified. Lines hold measured word
 *   boxes; joining them reconstructs the source string (asserted in tests).
 * - `fits` gates export. `legible` additionally reports whether the type is
 *   still at or above the template's floor at the size it settled on.
 */

import type { Locale } from '@/i18n'

export type { Measurer, MeasuredLine }
import { breakIntoLines, type Measurer, type MeasuredLine } from './linebreak'
import type { FrameId, LayoutVariant, Template } from './templates'
import type { ResolvedBlock } from '../types'

/** Shared font stacks so measurement and drawing can never disagree. */
export function arabicFont(size: number, weight = 400, family: 'body' | 'display' = 'body') {
  return family === 'display'
    ? `${weight} ${size}px "Thmanyah Display", "Amiri", serif`
    : `${weight} ${size}px "Amiri", "Thmanyah Display", serif`
}

export function labelFont(locale: Locale, size: number) {
  return locale === 'ar'
    ? `500 ${size}px "Thmanyah Display", "Amiri", serif`
    : `700 ${size}px "Space Mono", monospace`
}

export function citationFont(locale: Locale, size: number) {
  return locale === 'ar'
    ? `400 ${size}px "Thmanyah Sans", "Amiri", sans-serif`
    : `500 ${size}px "DM Sans", sans-serif`
}

export type Frame = {
  id: FrameId
  w: number
  h: number
  side: number
  areaTop: number
  footerH: number
  inset: number
  startArabic: number
  minArabic: number
  labelSize: number
  citationSize: number
  footerSize: number
}

export const FRAMES: Record<FrameId, Frame> = {
  square: {
    id: 'square',
    w: 1080,
    h: 1080,
    side: 118,
    areaTop: 152,
    footerH: 138,
    inset: 54,
    startArabic: 58,
    minArabic: 24,
    labelSize: 30,
    citationSize: 26,
    footerSize: 24,
  },
  portrait: {
    id: 'portrait',
    w: 1080,
    h: 1350,
    side: 118,
    areaTop: 168,
    footerH: 150,
    inset: 54,
    startArabic: 66,
    minArabic: 26,
    labelSize: 30,
    citationSize: 26,
    footerSize: 24,
  },
  story: {
    id: 'story',
    w: 1080,
    h: 1920,
    side: 132,
    areaTop: 208,
    footerH: 168,
    inset: 66,
    startArabic: 74,
    minArabic: 28,
    labelSize: 34,
    citationSize: 28,
    footerSize: 26,
  },
}

export type BlockLayout = {
  key: string
  label: string
  labelSize: number
  labelBaseline: number
  basmala: string | null
  basmalaSize: number
  basmalaLines: MeasuredLine[]
  basmalaBaselines: number[]
  arabicSize: number
  lineHeight: number
  arabicLines: MeasuredLine[]
  arabicBaselines: number[]
  citationSize: number
  citationLines: string[]
  citationBaselines: number[]
  height: number
  top: number
  /** True when the settled Arabic size is at/above the template floor. */
  legible: boolean
}

export type CardLayout = {
  fits: boolean
  legible: boolean
  frame: FrameId
  templateId: string
  variant: string
  locale: Locale
  w: number
  h: number
  inset: number
  contentWidth: number
  ornamentY: number
  blocks: BlockLayout[]
  dividers: number[]
  footerLines: string[]
  footerSize: number
  footerY: number
  /** Centre line for the footer, offset when a QR occupies the corner. */
  footerX: number
  footerWidth: number
  /** Scale the shrink loop settled on (1 = full size, lower = shrunk). */
  scale: number
}

/** Metadata lines (citations, footer): shrink-then-ellipsize is allowed here. */
function fitMeta(
  measure: Measurer,
  text: string,
  fontFor: (size: number) => string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
): { size: number; lines: string[] } {
  let size = startSize
  for (;;) {
    const font = fontFor(size)
    const lines = breakIntoLines(measure, text, font, maxWidth).map((line) =>
      line.words.map((word) => word.text).join(' '),
    )
    if (lines.length <= maxLines) return { size, lines }
    if (size <= minSize) {
      const kept = lines.slice(0, maxLines - 1)
      const tail = lines.slice(maxLines - 1).join(' ')
      kept.push(ellipsize(measure, tail, font, maxWidth))
      return { size, lines: kept }
    }
    size -= 2
  }
}

function ellipsize(measure: Measurer, line: string, font: string, maxWidth: number): string {
  if (measure.width(line, font) <= maxWidth) return line
  let short = line
  while (short.length > 1 && measure.width(`${short}…`, font) > maxWidth) {
    short = short.slice(0, -1).trimEnd()
  }
  return `${short}…`
}

type PlanOpts = {
  locale: Locale
  labelSize: number
  arabicSize: number
  citationSize: number
  contentWidth: number
  lineHeight: number
  bodyFamily: 'body' | 'display'
  displayFamily: 'body' | 'display'
}

function planBlock(measure: Measurer, block: ResolvedBlock, opts: PlanOpts): BlockLayout {
  const { locale, labelSize, arabicSize, citationSize, contentWidth, lineHeight } = opts
  const shownLabel = locale === 'en' ? block.label.toUpperCase() : block.label
  const label = ellipsize(measure, shownLabel, labelFont(locale, labelSize), contentWidth)

  const basmalaSize = Math.max(18, Math.round(arabicSize * 0.78))
  const basmalaLines = block.basmala
    ? breakIntoLines(measure, block.basmala, arabicFont(basmalaSize, 400, opts.displayFamily), contentWidth)
    : []

  const arabicLines = breakIntoLines(
    measure,
    block.arabic,
    arabicFont(arabicSize, 400, opts.bodyFamily),
    contentWidth,
  )

  const citation = fitMeta(
    measure,
    block.citation,
    (size) => citationFont(locale, size),
    contentWidth,
    2,
    citationSize,
    16,
  )

  let cursor = 0
  const labelBaseline = cursor + labelSize
  cursor += labelSize * 1.35 + 22

  const basmalaBaselines: number[] = []
  if (basmalaLines.length > 0) {
    const bh = basmalaSize * 1.7
    for (let i = 0; i < basmalaLines.length; i++) {
      basmalaBaselines.push(cursor + basmalaSize + i * bh)
    }
    cursor += bh * (basmalaLines.length - 1) + basmalaSize * 1.35 + 18
  }

  const arabicBaselines: number[] = []
  for (let i = 0; i < arabicLines.length; i++) {
    arabicBaselines.push(cursor + arabicSize + i * arabicSize * lineHeight)
  }
  cursor +=
    arabicSize * lineHeight * (arabicLines.length - 1) + arabicSize * 1.35 + 18

  const citationBaselines: number[] = []
  for (let i = 0; i < citation.lines.length; i++) {
    citationBaselines.push(cursor + citation.size + i * citation.size * 1.5)
  }
  cursor += citation.size * 1.5 * (citation.lines.length - 1) + citation.size * 1.35

  return {
    key: block.key,
    label,
    labelSize,
    labelBaseline,
    basmala: block.basmala,
    basmalaSize,
    basmalaLines,
    basmalaBaselines,
    arabicSize,
    lineHeight,
    arabicLines,
    arabicBaselines,
    citationSize: citation.size,
    citationLines: citation.lines,
    citationBaselines,
    height: cursor,
    top: 0,
    legible: true,
  }
}

function shiftPlan(plan: BlockLayout, dy: number): BlockLayout {
  const shift = (values: number[]) => values.map((value) => value + dy)
  return {
    ...plan,
    top: dy,
    labelBaseline: plan.labelBaseline + dy,
    basmalaBaselines: shift(plan.basmalaBaselines),
    arabicBaselines: shift(plan.arabicBaselines),
    citationBaselines: shift(plan.citationBaselines),
  }
}

export function layoutCard(
  measure: Measurer,
  opts: {
    blocks: ResolvedBlock[]
    frame: FrameId
    template: Template
    /** Overrides the template's own layout variant when set. */
    layout?: LayoutVariant | null
    /** Horizontal space reserved at the foot of the card (the verify QR). */
    footerReserve?: number
    locale: Locale
    footer: string
  },
): CardLayout {
  const frame = FRAMES[opts.frame]
  const { template } = opts
  const variant: LayoutVariant = opts.layout ?? template.layout
  const dividerH = opts.frame === 'story' ? 84 : 66
  const labelSize = template.labelSize
  const startArabic = frame.startArabic
  const minArabic = template.minArabic[opts.frame] ?? frame.minArabic
  const contentWidth = frame.w - frame.side * 2
  const contentLeft = (frame.w - contentWidth) / 2
  const areaTop = frame.areaTop
  const areaHeight = frame.h - frame.areaTop - frame.footerH - 16
  const footerTop = frame.h - frame.footerH

  let plans: BlockLayout[] = []
  let scale = 1
  let fits = opts.blocks.length === 0

  if (opts.blocks.length > 0) {
    const minScale = minArabic / startArabic
    for (scale = 1; scale >= Math.max(0.34, minScale) - 0.0001; scale -= 0.02) {
      plans = opts.blocks.map((block, index) => {
        const featured = variant === 'feature' && index === 0 && opts.blocks.length > 1
        const base = featured ? startArabic + 14 : startArabic
        const arabicSize = Math.max(minArabic, Math.round(base * scale))
        return planBlock(measure, block, {
          locale: opts.locale,
          labelSize,
          arabicSize,
          citationSize: Math.max(17, Math.round(frame.citationSize * Math.max(scale, 0.78))),
          contentWidth,
          lineHeight: template.lineHeight,
          bodyFamily: template.fonts.body,
          displayFamily: template.fonts.display,
        })
      })
      const total =
        plans.reduce((sum, plan) => sum + plan.height, 0) +
        dividerH * Math.max(0, plans.length - 1)
      if (total <= areaHeight) {
        fits = true
        break
      }
    }
  }

  const total =
    plans.reduce((sum, plan) => sum + plan.height, 0) +
    dividerH * Math.max(0, plans.length - 1)
  let cursor = areaTop + Math.max(0, (areaHeight - total) / 2)
  const dividers: number[] = []
  // Legibility is judged against a *comfort* floor, one fifth above the hard
  // minimum: a card that only fits at the absolute minimum is flagged so the
  // UI can suggest a calmer template instead of shipping tiny text.
  const comfortFloor = Math.round(minArabic * 1.2)
  const placed = plans.map((plan, index) => {
    const shifted = shiftPlan(plan, cursor)
    shifted.legible = plan.arabicSize >= comfortFloor
    cursor += plan.height
    if (index < plans.length - 1) {
      dividers.push(cursor + dividerH / 2)
      cursor += dividerH
    }
    return shifted
  })
  const legible = placed.every((plan) => plan.legible)

  // When a QR is present the footer is centred in the space left of it, so the
  // provenance is never covered by the code.
  const reserve = Math.min(opts.footerReserve ?? 0, contentWidth - 160)
  const footerLeft = contentLeft + reserve
  const footerWidth = Math.max(120, contentWidth - reserve)
  const footer = fitMeta(
    measure,
    opts.footer,
    (size) => citationFont(opts.locale, size),
    footerWidth,
    2,
    frame.footerSize,
    15,
  )

  return {
    fits,
    legible,
    frame: opts.frame,
    templateId: template.id,
    variant,
    locale: opts.locale,
    w: frame.w,
    h: frame.h,
    inset: frame.inset,
    contentWidth,
    ornamentY: areaTop - 72,
    blocks: placed,
    dividers,
    footerLines: footer.lines,
    footerSize: footer.size,
    footerY: footerTop + footer.size * 1.4,
    footerX: footerLeft + footerWidth / 2,
    footerWidth,
    scale: Number(scale.toFixed(2)),
  }
}
