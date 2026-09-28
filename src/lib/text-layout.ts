/**
 * Pure text layout used by canvas card renderers. No DOM, no canvas —
 * callers pass a `measure(text, font)` function so every computation is
 * unit-testable.
 */

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
