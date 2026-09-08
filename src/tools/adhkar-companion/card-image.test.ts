import { describe, expect, it } from 'vitest'
import { DHIKR } from './adhkar-data'
import {
  IMAGE_FRAMES,
  ellipsize,
  fallbackPalette,
  fitText,
  layoutSingleCard,
  pickFormat,
  planSummaryRows,
  singleCardGeometry,
  wrapText,
  type Measure,
} from './card-image'

/** Deterministic stub: 0.5em per char, 0.28em per space. */
const stubMeasure: Measure = (text, font) => {
  const size = Number(font.split('px')[0]?.split(' ').pop() ?? '16') || 16
  let w = 0
  for (const ch of text) w += ch === ' ' ? size * 0.28 : size * 0.5
  return w
}

/** Realistic Arabic stub: narrow glyphs — closer to Thmanyah advances. */
const arabicMeasure: Measure = (text, font) => {
  const size = Number(font.split('px')[0]?.split(' ').pop() ?? '16') || 16
  let w = 0
  for (const ch of text) w += ch === ' ' ? size * 0.28 : size * 0.36
  return w
}

/** Adversarial stub: everything wide — proves graceful behavior under bad metrics. */
const wideMeasure: Measure = (text, font) => {
  const size = Number(font.split('px')[0]?.split(' ').pop() ?? '16') || 16
  return text.length * size * 0.6
}

describe('card-image wrap', () => {
  it('wraps on spaces within width', () => {
    const lines = wrapText(stubMeasure, 'a b c d e', '400 20px X', 34)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe('a b c d e')
  })

  it('hard-splits overlong words without losing characters', () => {
    const word = 'abcdefghij'
    const lines = wrapText(stubMeasure, word, '400 20px X', 25)
    expect(lines.join('')).toBe(word)
  })

  it('never returns an empty array', () => {
    expect(wrapText(stubMeasure, '   ', '400 20px X', 100)).toEqual([''])
  })
})

describe('card-image fit', () => {
  it('keeps short text at start size on one line', () => {
    const r = fitText(stubMeasure, 'سُبْحَانَ اللَّهِ', {
      family: 'Y',
      weight: 500,
      startSize: 68,
      minSize: 36,
      maxWidth: 780,
      maxLines: 8,
    })
    expect(r.size).toBe(68)
    expect(r.lines).toHaveLength(1)
  })

  it('shrinks long text until it fits maxLines', () => {
    const longest = DHIKR.reduce((a, b) => (a.arabic.length >= b.arabic.length ? a : b))
    for (const frame of ['portrait', 'square'] as const) {
      const geo = singleCardGeometry(frame)
      const r = fitText(stubMeasure, longest.arabic, {
        family: 'Y',
        weight: 500,
        startSize: frame === 'square' ? 60 : 68,
        minSize: frame === 'square' ? 32 : 36,
        maxWidth: geo.contentWidth,
        maxLines: 10,
      })
      expect(r.lines.length).toBeLessThanOrEqual(10)
    }
  })

  it('every dataset item fits both frames', () => {
    for (const item of DHIKR) {
      for (const frame of ['portrait', 'square'] as const) {
        const geo = singleCardGeometry(frame)
        const r = fitText(stubMeasure, item.arabic, {
          family: 'Y',
          weight: 500,
          startSize: frame === 'square' ? 60 : 68,
          minSize: frame === 'square' ? 32 : 36,
          maxWidth: geo.contentWidth,
          maxLines: 10,
        })
        expect(r.lines.length, `${item.id}/${frame}`).toBeLessThanOrEqual(10)
        expect(r.lines.join(' ').replace(/\s+/g, ' ').trim().length).toBeGreaterThan(0)
      }
    }
  })
})

describe('card-image geometry', () => {
  it('frames have expected dimensions', () => {
    expect(IMAGE_FRAMES.portrait).toEqual({ w: 1080, h: 1350 })
    expect(IMAGE_FRAMES.square).toEqual({ w: 1080, h: 1080 })
  })

  it('geometry stays inside the frame', () => {
    for (const frame of ['portrait', 'square'] as const) {
      const g = singleCardGeometry(frame)
      for (const y of [g.eyebrowArY, g.eyebrowEnY, g.ornamentY, g.titleY, g.arabicTop, g.sourceY, g.footerWarn2Y]) {
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(g.h)
      }
      expect(g.footerWarn2Y).toBeGreaterThan(g.sourceY)
      expect(g.footerTop).toBeGreaterThan(g.arabicTop)
    }
  })

  it('palettes expose every slot', () => {
    for (const mood of ['forest', 'parchment'] as const) {
      const p = fallbackPalette(mood)
      for (const v of Object.values(p)) expect(v).toMatch(/^#[0-9a-f]{6}$/i)
    }
    expect(fallbackPalette('forest').bg).not.toBe(fallbackPalette('parchment').bg)
  })
})

describe('card-image single layout', () => {
  it('every dataset item fits both frames with realistic metrics', () => {
    for (const item of DHIKR) {
      for (const frame of ['portrait', 'square'] as const) {
        const layout = layoutSingleCard(arabicMeasure, {
          frame,
          arabic: item.arabic,
          meaning: item.meaningEn,
          titleLine: `${item.titleAr} · ${item.titleEn}`,
        })
        expect(layout.fits, `${item.id}/${frame}`).toBe(true)
        expect(layout.titleLines.length, `${item.id}/${frame} title`).toBeLessThanOrEqual(2)
      }
    }
  })

  it('never slices sacred text, even under adversarial metrics', () => {
    const normalize = (s: string) => s.split(/\s+/).filter(Boolean).join(' ')
    for (const item of DHIKR) {
      for (const frame of ['portrait', 'square'] as const) {
        const layout = layoutSingleCard(wideMeasure, {
          frame,
          arabic: item.arabic,
          meaning: item.meaningEn,
          titleLine: `${item.titleAr} · ${item.titleEn}`,
        })
        // Words in = words out, whatever `fits` reports. Callers block on !fits.
        expect(normalize(layout.arabicLines.join(' ')), `${item.id}/${frame}`).toBe(
          normalize(item.arabic),
        )
      }
    }
  })

  it('longest item keeps a readable size in portrait', () => {
    const longest = DHIKR.reduce((a, b) => (a.arabic.length >= b.arabic.length ? a : b))
    const layout = layoutSingleCard(arabicMeasure, {
      frame: 'portrait',
      arabic: longest.arabic,
      meaning: longest.meaningEn,
      titleLine: longest.titleAr,
    })
    expect(layout.fits).toBe(true)
    expect(layout.arabicSize).toBeGreaterThanOrEqual(24)
  })
})

describe('card-image helpers', () => {
  it('ellipsize keeps short lines and trims long ones', () => {
    expect(ellipsize(stubMeasure, 'short', '400 20px X', 500)).toBe('short')
    const long = ellipsize(stubMeasure, 'a b c d e f g', '400 20px X', 40)
    expect(long.endsWith('…')).toBe(true)
    expect(stubMeasure(long, '400 20px X')).toBeLessThanOrEqual(40)
  })

  it('pickFormat honors support with PNG fallback', () => {
    expect(pickFormat('png', ['png'])).toBe('png')
    expect(pickFormat('webp', ['png', 'webp'])).toBe('webp')
    expect(pickFormat('webp', ['png', 'jpeg'])).toBe('png')
    expect(pickFormat('jpeg', [])).toBe('png')
  })
})

describe('card-image summary rows', () => {
  it('fits 16 rows in the portrait budget across two columns', () => {
    const p = planSummaryRows(16, 568, 1120)
    expect(p.rowsShown).toBe(16)
    expect(p.truncated).toBe(0)
    expect(p.columns).toBe(2)
  })

  it('keeps small sets in one column', () => {
    const p = planSummaryRows(3, 568, 1120)
    expect(p.rowsShown).toBe(3)
    expect(p.truncated).toBe(0)
    expect(p.columns).toBe(1)
  })

  it('truncates explicitly when space is tight', () => {
    const p = planSummaryRows(18, 560, 760)
    expect(p.rowsShown + p.truncated).toBe(18)
    expect(p.truncated).toBeGreaterThan(0)
    expect(p.rowsShown).toBeGreaterThan(0)
  })

  it('handles empty lists', () => {
    const p = planSummaryRows(0, 100, 500)
    expect(p.rowsShown).toBe(0)
    expect(p.truncated).toBe(0)
  })
})
