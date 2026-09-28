import { describe, expect, it } from 'vitest'
import { CARD_PALETTES, CONTRAST_FLOOR, contrastRatio, getPalette } from './palette'
import { TEMPLATES } from '../engine/templates'

describe('card palettes', () => {
  it('every palette clears the contrast floors', () => {
    for (const [id, palette] of Object.entries(CARD_PALETTES)) {
      // The Arabic text is large, but citations and the footer are not.
      expect(contrastRatio(palette.ink, palette.bg), `${id} body`).toBeGreaterThanOrEqual(CONTRAST_FLOOR.body)
      expect(contrastRatio(palette.citation, palette.bg), `${id} citation`).toBeGreaterThanOrEqual(
        CONTRAST_FLOOR.small,
      )
      expect(contrastRatio(palette.label, palette.bg), `${id} label`).toBeGreaterThanOrEqual(
        CONTRAST_FLOOR.small,
      )
      expect(contrastRatio(palette.footer, palette.bg), `${id} footer`).toBeGreaterThanOrEqual(
        CONTRAST_FLOOR.small,
      )
    }
  })

  it('contrast math is correct and bounded', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5)
    const ratio = contrastRatio('#f6f2e8', '#232d29')
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThanOrEqual(21)
  })

  it('every template resolves to a palette that passes', () => {
    for (const template of TEMPLATES) {
      const palette = getPalette(template.palette)
      expect(palette, template.id).toBeDefined()
      expect(contrastRatio(palette.citation, palette.bg), template.id).toBeGreaterThanOrEqual(
        CONTRAST_FLOOR.small,
      )
    }
  })
})
