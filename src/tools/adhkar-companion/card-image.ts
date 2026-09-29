/**
 * Pure layout for Adhkar share images. No DOM, no canvas — callers pass a
 * `measure(text, font)` function so every computation is unit-testable.
 *
 * Frames: portrait 1080×1350 (stories/status) + square 1080×1080 (feeds).
 * Moods: forest (dark) + parchment (light). All art is drawn
 * programmatically by the renderer; this module only computes geometry.
 */

import type { Measure } from '@/lib/text-layout'
import { wrapText, fitText, ellipsize } from '@/lib/text-layout'
import {
  FORMAT_EXT,
  FORMAT_MIME,
  FORMAT_QUALITY,
  pickFormat,
  type ImageFormat,
} from '@/lib/image-export'

export type ImageFrame = 'portrait' | 'square'
export type ImageMood = 'forest' | 'parchment'
export type ImageResolution = 'full' | 'compact'

export { FORMAT_EXT, FORMAT_MIME, FORMAT_QUALITY, pickFormat, wrapText, fitText, ellipsize }
export type { ImageFormat, Measure }

export const IMAGE_FRAMES: Record<ImageFrame, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
}

/** Canvas pixel scale per resolution. Compact ≈ ¼ the bytes — WhatsApp-friendly. */
export const IMAGE_SCALES: Record<ImageResolution, number> = { full: 2, compact: 1 }

/** Shared font stacks so layout measurement and rendering can never disagree. */
export const arabicFont = (size: number, weight = 500) =>
  `${weight} ${size}px "Thmanyah Display", serif`
export const microFont = (size: number) =>
  `700 ${size}px "Space Mono", "Thmanyah Sans", monospace`
export const titleFont = (size: number) =>
  `500 ${size}px "Thmanyah Display", "DM Sans", serif`

export type CardPalette = {
  bg: string
  glow: string
  lattice: string
  frameOuter: string
  frameInner: string
  eyebrow: string
  ornament: string
  title: string
  arabic: string
  pillBg: string
  pillText: string
  meaning: string
  micro: string
  ringTrack: string
  ringFill: string
  check: string
}

/** Fallback hex mirrors of the theme tokens in `src/styles/app.css`. */
const FOREST_FALLBACK: CardPalette = {
  bg: '#234336',
  glow: '#3c5f4c',
  lattice: '#f5f2ea',
  frameOuter: '#c5d58b',
  frameInner: '#c5d58b',
  eyebrow: '#c5d58b',
  ornament: '#c5d58b',
  title: '#f5f2ea',
  arabic: '#f5f2ea',
  pillBg: '#c5d58b',
  pillText: '#24332e',
  meaning: '#f5f2ea',
  micro: '#f5f2ea',
  ringTrack: '#f5f2ea',
  ringFill: '#c5d58b',
  check: '#c5d58b',
}

const PARCHMENT_FALLBACK: CardPalette = {
  bg: '#f5f2ea',
  glow: '#ffffff',
  lattice: '#24332e',
  frameOuter: '#2e5c44',
  frameInner: '#2e5c44',
  eyebrow: '#2e5c44',
  ornament: '#b25a24',
  title: '#24332e',
  arabic: '#24332e',
  pillBg: '#2e5c44',
  pillText: '#f5f2ea',
  meaning: '#24332e',
  micro: '#24332e',
  ringTrack: '#24332e',
  ringFill: '#2e5c44',
  check: '#2e5c44',
}

export function fallbackPalette(mood: ImageMood): CardPalette {
  return mood === 'forest' ? { ...FOREST_FALLBACK } : { ...PARCHMENT_FALLBACK }
}

export type SingleCardGeometry = {
  frame: ImageFrame
  w: number
  h: number
  contentWidth: number
  eyebrowY: number
  ornamentY: number
  titleY: number
  arabicTop: number
  pillGap: number
  pillH: number
  meaningGap: number
  meaningMaxLines: number
  arabicLineHeight: number
  footerTop: number
  sourceY: number
  warnY: number
}

export function singleCardGeometry(frame: ImageFrame): SingleCardGeometry {
  const { w, h } = IMAGE_FRAMES[frame]
  if (frame === 'square') {
    return {
      frame, w, h,
      contentWidth: w - 300,
      eyebrowY: 132,
      ornamentY: 200,
      titleY: 252,
      arabicTop: 328,
      pillGap: 44,
      pillH: 76,
      meaningGap: 48,
      meaningMaxLines: 2,
      arabicLineHeight: 1.8,
      footerTop: h - 130,
      sourceY: h - 196,
      warnY: h - 148,
    }
  }
  return {
    frame, w, h,
      contentWidth: w - 300,
      eyebrowY: 172,
      ornamentY: 250,
      titleY: 310,
      arabicTop: 394,
    pillGap: 52,
    pillH: 84,
      meaningGap: 56,
      meaningMaxLines: 3,
      arabicLineHeight: 1.9,
      footerTop: h - 130,
    sourceY: h - 258,
    warnY: h - 208,
  }
}

export type SingleLayout = {
  fits: boolean
  arabicSize: number
  arabicLines: string[]
  titleSize: number
  titleLines: string[]
}

/**
 * Height-aware single-card layout. The Arabic block is NEVER sliced:
 * `arabicLines` always reconstruct the full input, and `fits` reports
 * whether everything lands above the footer. Callers must refuse export
 * when `fits` is false.
 */
export function layoutSingleCard(
  measure: Measure,
  opts: {
    frame: ImageFrame
    arabic: string
    titleLine: string
  },
): SingleLayout {
  const geo = singleCardGeometry(opts.frame)
  const minArabic = opts.frame === 'square' ? 22 : 24
  const startArabic = opts.frame === 'square' ? 60 : 68

  const titleFit = fitText(measure, opts.titleLine, {
    family: '"Thmanyah Display", "DM Sans", serif',
    weight: 500,
    startSize: 44,
    minSize: 34,
    maxWidth: geo.contentWidth,
    maxLines: 2,
  })

  for (let aSize = startArabic; aSize >= minArabic; aSize -= 2) {
    const arabicLines = wrapText(measure, opts.arabic, arabicFont(aSize), geo.contentWidth)
    const arabicBottom = geo.arabicTop + (arabicLines.length - 1) * aSize * geo.arabicLineHeight
    if (arabicBottom <= geo.footerTop) {
      return {
        fits: true,
        arabicSize: aSize,
        arabicLines,
        titleSize: titleFit.size,
        titleLines: titleFit.lines,
      }
    }
  }
  return {
    fits: false,
    arabicSize: minArabic,
    arabicLines: wrapText(measure, opts.arabic, arabicFont(minArabic), geo.contentWidth),
    titleSize: titleFit.size,
    titleLines: titleFit.lines,
  }
}

