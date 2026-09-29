import { describe, expect, it } from 'vitest'
import {
  breakIntoLines,
  graphemes,
  linesToText,
  splitWords,
} from './linebreak'
import { createStubMeasure } from './measure'

const measure = createStubMeasure()

describe('graphemes', () => {
  it('keeps a base letter with its combining marks', () => {
    // Arabic letter + fatha + shadda should be one cluster, never split.
    const word = 'بُّ' // b + shadda + damma
    const clusters = graphemes(word)
    expect(clusters.length).toBe(1)
  })

  it('keeps a lam-alif sequence together', () => {
    const word = 'لا' // lam + alef (a ligature-forming pair)
    const clusters = graphemes(word)
    expect(clusters.join('')).toBe(word)
  })
})

describe('splitWords', () => {
  it('splits on whitespace and keeps source offsets', () => {
    const text = 'alpha beta gamma'
    const words = splitWords(text)
    expect(words.map((w) => w.text)).toEqual(['alpha', 'beta', 'gamma'])
    expect(text.slice(words[1]!.start, words[1]!.end)).toBe('beta')
  })
})

describe('breakIntoLines', () => {
  it('never starts a line with a combining mark', () => {
    // Many short "words" that are single letters each carrying a mark.
    const word = 'بُّ'
    const text = Array.from({ length: 40 }, () => word).join(' ')
    const lines = breakIntoLines(measure, text, '400 24px "Amiri"', 60)
    for (const line of lines) {
      for (const w of line.words) {
        // A line must not begin with a lone combining mark (U+064B–U+0652).
        expect(/^[\u064B-\u0652]/.test(w.text), JSON.stringify(w.text)).toBe(false)
      }
    }
  })

  it('reconstructs the full text with no clipping', () => {
    const text = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ')
    const lines = breakIntoLines(measure, text, '400 24px "Amiri"', 200)
    expect(linesToText(lines)).toBe(text)
  })

  it('hard-splits an overlong word only between graphemes', () => {
    const long = 'ب'.repeat(200)
    const lines = breakIntoLines(measure, long, '400 24px "Amiri"', 120)
    expect(linesToText(lines).replace(/\s+/g, '')).toBe(long)
    for (const line of lines) {
      for (const w of line.words) {
        expect(graphemes(w.text).length).toBe(w.text.length) // single-cluster chunks
      }
    }
  })

  it('reports slack for justification on non-final lines', () => {
    const text = Array.from({ length: 12 }, (_, i) => `w${i}`).join(' ')
    const lines = breakIntoLines(measure, text, '400 24px "Amiri"', 300)
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines.slice(0, -1)) {
      expect(line.slack).toBeGreaterThan(0)
    }
  })
})
