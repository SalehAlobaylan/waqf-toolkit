/**
 * Pure layout for Adhkar share images. No DOM, no canvas — callers pass a
 * `measure(text, font)` function so every computation is unit-testable.
 *
 * Frames: portrait 1080×1350 (stories/status) + square 1080×1080 (feeds).
 * Moods: forest (dark) + parchment (light). All art is drawn
 * programmatically by the renderer; this module only computes geometry.
 */

export type ImageFrame = 'portrait' | 'square'
export type ImageMood = 'forest' | 'parchment'
export type ImageResolution = 'full' | 'compact'
export type ImageFormat = 'png' | 'jpeg' | 'webp'

export const IMAGE_FRAMES: Record<ImageFrame, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
}

/** Canvas pixel scale per resolution. Compact ≈ ¼ the bytes — WhatsApp-friendly. */
export const IMAGE_SCALES: Record<ImageResolution, number> = { full: 2, compact: 1 }

export const FORMAT_MIME: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export const FORMAT_QUALITY: Record<ImageFormat, number | undefined> = {
  png: undefined,
  jpeg: 0.92,
  webp: 0.9,
}

export const FORMAT_EXT: Record<ImageFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
}

/** Pick a supported format, falling back to PNG. Pure — `supported` is injected for tests. */
export function pickFormat(requested: ImageFormat, supported: ImageFormat[]): ImageFormat {
  if (supported.includes(requested)) return requested
  return 'png'
}

/** Shared font stacks so layout measurement and rendering can never disagree. */
export const arabicFont = (size: number, weight = 500) =>
  `${weight} ${size}px "Thmanyah Display", serif`
export const meaningFont = (size: number) =>
  `400 ${size}px "DM Sans", "Thmanyah Sans", sans-serif`
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

export type Measure = (text: string, font: string) => number

/** Greedy word wrap. Words longer than maxWidth hard-split by character. */
export function wrapText(
  measure: Measure,
  text: string,
  font: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  const push = (word: string) => {
    if (measure(word, font) > maxWidth) {
      if (current !== '') {
        lines.push(current)
        current = ''
      }
      let chunk = ''
      for (const ch of word) {
        if (measure(chunk + ch, font) > maxWidth && chunk !== '') {
          lines.push(chunk)
          chunk = ch
        } else {
          chunk += ch
        }
      }
      current = chunk
      return
    }
    const trial = current === '' ? word : `${current} ${word}`
    if (measure(trial, font) > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = trial
    }
  }
  for (const w of words) push(w)
  if (current !== '') lines.push(current)
  return lines.length === 0 ? [''] : lines
}

export type FitText = { size: number; lines: string[] }

/**
 * Shrink-to-fit: largest size in [minSize, startSize] whose wrapped lines
 * fit maxLines. Steps down 2px at a time for stable, testable results.
 */
export function fitText(
  measure: Measure,
  text: string,
  opts: {
    family: string
    weight: number | string
    startSize: number
    minSize: number
    maxWidth: number
    maxLines: number
    linePrefix?: string
  },
): FitText {
  const { family, weight, startSize, minSize, maxWidth, maxLines, linePrefix = '' } = opts
  let size = startSize
  for (;;) {
    const font = `${weight} ${size}px ${family}`
    const lines = wrapText(measure, linePrefix + text, font, maxWidth)
    if (lines.length <= maxLines || size <= minSize) {
      return { size: Math.max(size, minSize), lines: lines.slice(0, maxLines) }
    }
    size -= 2
  }
}

export type SingleCardGeometry = {
  frame: ImageFrame
  w: number
  h: number
  contentWidth: number
  eyebrowArY: number
  eyebrowEnY: number
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
  footerWordmarkY: number
  footerWarnY: number
  footerWarn2Y: number
}

export function singleCardGeometry(frame: ImageFrame): SingleCardGeometry {
  const { w, h } = IMAGE_FRAMES[frame]
  if (frame === 'square') {
    return {
      frame, w, h,
      contentWidth: w - 300,
      eyebrowArY: 116,
      eyebrowEnY: 154,
      ornamentY: 200,
      titleY: 250,
      arabicTop: 302,
      pillGap: 44,
      pillH: 76,
      meaningGap: 48,
      meaningMaxLines: 2,
      arabicLineHeight: 1.8,
      footerTop: h - 200 - 34,
      sourceY: h - 200,
      footerWordmarkY: h - 148,
      footerWarnY: h - 104,
      footerWarn2Y: h - 70,
    }
  }
  return {
    frame, w, h,
    contentWidth: w - 300,
    eyebrowArY: 156,
    eyebrowEnY: 198,
    ornamentY: 250,
    titleY: 308,
    arabicTop: 368,
    pillGap: 52,
    pillH: 84,
    meaningGap: 56,
    meaningMaxLines: 3,
    arabicLineHeight: 1.9,
    footerTop: h - 262 - 34,
    sourceY: h - 262,
    footerWordmarkY: h - 196,
    footerWarnY: h - 142,
    footerWarn2Y: h - 102,
  }
}

export type SingleLayout = {
  fits: boolean
  arabicSize: number
  arabicLines: string[]
  titleSize: number
  titleLines: string[]
  meaningSize: number
  meaningLines: string[]
}

/** Trim a line to maxWidth with an ellipsis. Width-only — safe for UI hints, never sacred text. */
export function ellipsize(
  measure: Measure,
  line: string,
  font: string,
  maxWidth: number,
): string {
  if (measure(line, font) <= maxWidth) return line
  let short = line
  while (short.length > 1 && measure(`${short}…`, font) > maxWidth) {
    short = short.slice(0, -1).trimEnd()
  }
  return `${short}…`
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
    meaning: string
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

  const meaningSizes = [38, 36, 34, 32, 30, 28]
  for (let aSize = startArabic; aSize >= minArabic; aSize -= 2) {
    const arabicLines = wrapText(measure, opts.arabic, arabicFont(aSize), geo.contentWidth)
    const arabicBottom = geo.arabicTop + (arabicLines.length - 1) * aSize * geo.arabicLineHeight
    const meaningTop = arabicBottom + geo.pillGap + geo.pillH + geo.meaningGap
    for (const mSize of meaningSizes) {
      const raw = opts.meaning.trim() === '' ? [] : wrapText(measure, opts.meaning, meaningFont(mSize), geo.contentWidth)
      const truncated = raw.length > geo.meaningMaxLines
      const kept = raw.slice(0, geo.meaningMaxLines)
      const meaningLines =
        truncated && kept.length > 0
          ? [
              ...kept.slice(0, -1),
              ellipsize(measure, kept[kept.length - 1]!, meaningFont(mSize), geo.contentWidth),
            ]
          : kept
      const meaningBottom =
        meaningLines.length === 0
          ? meaningTop - geo.meaningGap
          : meaningTop + (meaningLines.length - 1) * mSize * 1.6
      if (meaningBottom <= geo.footerTop) {
        return {
          fits: true,
          arabicSize: aSize,
          arabicLines,
          titleSize: titleFit.size,
          titleLines: titleFit.lines,
          meaningSize: mSize,
          meaningLines,
        }
      }
    }
  }
  return {
    fits: false,
    arabicSize: minArabic,
    arabicLines: wrapText(measure, opts.arabic, arabicFont(minArabic), geo.contentWidth),
    titleSize: titleFit.size,
    titleLines: titleFit.lines,
    meaningSize: 28,
    meaningLines: [],
  }
}

export type SummaryRowPlan = {
  rowsShown: number
  truncated: number
  columns: 1 | 2
  rowH: number
  fontSize: number
  listTop: number
  listBottom: number
}

const ROW_STEPS = [
  { rowH: 62, fontSize: 36 },
  { rowH: 54, fontSize: 33 },
  { rowH: 46, fontSize: 30 },
  { rowH: 40, fontSize: 27 },
  { rowH: 34, fontSize: 24 },
]

const MORE_RESERVE = 48

/**
 * Checklist rows between `listTop` and `listBottom`. Prefers one column,
 * spills to two, shrinks rows, and only then truncates — truncation is
 * always explicit (`+N more`) with reserved space for that line.
 */
export function planSummaryRows(
  itemCount: number,
  listTop: number,
  listBottom: number,
): SummaryRowPlan {
  const available = Math.max(0, listBottom - listTop)
  const base = { listTop, listBottom }
  if (itemCount === 0) {
    return { rowsShown: 0, truncated: 0, columns: 1, rowH: 62, fontSize: 36, ...base }
  }
  for (let i = 0; i < ROW_STEPS.length; i++) {
    const c = ROW_STEPS[i]!
    const per = Math.floor(available / c.rowH)
    if (per < 4) continue
    if (itemCount <= per) {
      return { rowsShown: itemCount, truncated: 0, columns: 1, ...c, ...base }
    }
    if (itemCount <= 2 * per) {
      return { rowsShown: itemCount, truncated: 0, columns: 2, ...c, ...base }
    }
    const perT = Math.floor((available - MORE_RESERVE) / c.rowH)
    if (perT < 4) continue
    if (itemCount <= 2 * perT) {
      return { rowsShown: itemCount, truncated: 0, columns: 2, ...c, ...base }
    }
    if (i === ROW_STEPS.length - 1) {
      const shown = 2 * perT
      return { rowsShown: shown, truncated: itemCount - shown, columns: 2, ...c, ...base }
    }
  }
  // Degenerate space: pack the smallest rows, truncate explicitly.
  const perT = Math.max(1, Math.floor((available - MORE_RESERVE) / 34))
  const shown = Math.min(itemCount, 2 * perT)
  return { rowsShown: shown, truncated: itemCount - shown, columns: 2, rowH: 34, fontSize: 24, ...base }
}
