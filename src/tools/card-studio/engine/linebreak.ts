/**
 * Script-aware line breaking.
 *
 * V1 wrapped on whitespace and hard-split overlong words **by character**,
 * which can detach a base letter from its tashkeel or cut a lam-alif ligature.
 * V2 breaks between grapheme clusters only, and reports every word as a
 * measured box so the renderer can justify by distributing *space between
 * words* — never by inserting kashida, which would mutate the text.
 */

export type WordBox = {
  text: string
  width: number
  /** Character offsets in the source string, for provenance-safe reconstruction. */
  start: number
  end: number
}

export type Measurer = {
  /** Shaped width of a single run at the given canvas font string. */
  width(text: string, font: string): number
}

const segmenter: Intl.Segmenter | null =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('ar', { granularity: 'grapheme' })
    : null

/** Grapheme clusters. Falls back to code points where Intl.Segmenter is absent. */
export function graphemes(text: string): string[] {
  if (!segmenter) return [...text]
  const out: string[] = []
  for (const { segment } of segmenter.segment(text)) out.push(segment)
  return out
}

/**
 * Whitespace-delimited words with their source offsets. The text is never
 * modified; only whitespace between words is dropped from the boxes.
 */
export function splitWords(text: string): WordBox[] {
  const words: WordBox[] = []
  let start = -1
  for (let i = 0; i < text.length; i++) {
    const isSpace = /\s/.test(text[i]!)
    if (!isSpace && start === -1) start = i
    if (isSpace && start !== -1) {
      words.push({ text: text.slice(start, i), width: 0, start, end: i })
      start = -1
    }
  }
  if (start !== -1) {
    words.push({ text: text.slice(start), width: 0, start, end: text.length })
  }
  return words
}

function spaceWidth(measure: Measurer, font: string): number {
  return measure.width(' ', font)
}

/** Split an overlong word into cluster-packed chunks that each fit maxWidth. */
function hardSplit(
  measure: Measurer,
  word: WordBox,
  font: string,
  maxWidth: number,
): WordBox[] {
  const clusters = graphemes(word.text)
  const out: WordBox[] = []
  let chunk = ''
  let chunkStart = word.start
  for (const cluster of clusters) {
    const trial = chunk + cluster
    if (chunk !== '' && measure.width(trial, font) > maxWidth) {
      out.push({
        text: chunk,
        width: measure.width(chunk, font),
        start: chunkStart,
        end: chunkStart + chunk.length,
      })
      chunk = cluster
      chunkStart = word.start + word.text.indexOf(cluster, chunkStart - word.start)
    } else {
      chunk = trial
    }
  }
  if (chunk !== '') {
    out.push({
      text: chunk,
      width: measure.width(chunk, font),
      start: chunkStart,
      end: chunkStart + chunk.length,
    })
  }
  return out
}

export type MeasuredLine = {
  words: WordBox[]
  /** Sum of word widths (no trailing/leading space). */
  width: number
  /** Space that justification may distribute: `maxWidth - width`. */
  slack: number
}

export type BreakOptions = {
  /** Prefer a shorter last line (default true, keeps ragged edges calm). */
  raggedLastLine?: boolean
}

/**
 * Greedy line breaking that never splits a grapheme cluster and never
 * modifies a character. `lineWidth` is the sum of shaped word widths.
 */
export function breakIntoLines(
  measure: Measurer,
  text: string,
  font: string,
  maxWidth: number,
  opts: BreakOptions = {},
): MeasuredLine[] {
  const space = spaceWidth(measure, font)
  const raw = splitWords(text)
  if (raw.length === 0) return [{ words: [], width: 0, slack: 0 }]

  // Expand any word that cannot fit on its own line.
  const words: WordBox[] = []
  for (const word of raw) {
    const width = measure.width(word.text, font)
    if (width > maxWidth) {
      words.push(...hardSplit(measure, word, font, maxWidth))
    } else {
      words.push({ ...word, width })
    }
  }

  const lines: MeasuredLine[] = []
  let current: WordBox[] = []
  let currentWidth = 0
  for (const word of words) {
    const addition = current.length === 0 ? word.width : space + word.width
    if (current.length > 0 && currentWidth + addition > maxWidth) {
      lines.push({ words: current, width: currentWidth, slack: maxWidth - currentWidth })
      current = [word]
      currentWidth = word.width
    } else {
      current.push(word)
      currentWidth += addition
    }
  }
  if (current.length > 0) {
    lines.push({ words: current, width: currentWidth, slack: maxWidth - currentWidth })
  }

  if (opts.raggedLastLine === false && lines.length > 1) {
    for (const line of lines) line.slack = Math.max(0, line.slack)
  }
  return lines
}

/** The source text a set of lines represents — used by the verbatim guarantee. */
export function linesToText(lines: MeasuredLine[]): string {
  return lines
    .map((line) => line.words.map((word) => word.text).join(' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
