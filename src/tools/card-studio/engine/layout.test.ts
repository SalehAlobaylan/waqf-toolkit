import { describe, expect, it } from 'vitest'
import { layoutCard, FRAMES } from './layout'
import { createStubMeasure } from './measure'
import { linesToText } from './linebreak'
import { getTemplate, TEMPLATES, isValidTemplateId, DEFAULT_TEMPLATE_ID } from './templates'
import { loadSurah, SURAHS } from '../data/quran'
import type { ResolvedBlock } from '../types'

const measure = createStubMeasure()
/**
 * Arabic advance widths in Amiri average ~0.46em including tashkeel, versus
 * ~0.52em for the Latin-tuned default. The sweep uses the realistic factor so
 * it reflects what a browser actually measures.
 */
const arabicMeasure = createStubMeasure(0.46)

function block(key: string, arabic: string, overrides: Partial<ResolvedBlock> = {}): ResolvedBlock {
  return {
    key,
    label: 'Ayah',
    arabic,
    basmala: null,
    citation: 'Al-Baqarah • 2:255',
    unverified: false,
    provenance: { kind: 'ayah', surah: 2, ayahStart: 255, ayahEnd: 255 },
    ...overrides,
  }
}

const sample = [
  block('a', 'first short block text'),
  block('b', 'second short block text'),
  block('c', 'third short block text'),
]

function layout(
  blocks: ResolvedBlock[],
  templateId = DEFAULT_TEMPLATE_ID,
  frame: 'square' | 'portrait' | 'story' = 'square',
  layoutOverride: 'classic' | 'feature' | null = null,
  measurer: typeof measure = measure,
) {
  return layoutCard(measurer, {
    blocks,
    frame,
    template: getTemplate(templateId),
    layout: layoutOverride,
    locale: 'en',
    footer: 'Sources: Quran: Tanzil Uthmani. Verify against the original. Not a mushaf.',
  })
}

describe('templates', () => {
  it('ships a catalog of at least 20 templates with unique ids', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(20)
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template has valid floors and a default', () => {
    for (const template of TEMPLATES) {
      expect(template.minArabic.square).toBeGreaterThan(0)
      expect(template.lineHeight).toBeGreaterThan(1.5)
      expect(isValidTemplateId(template.id)).toBe(true)
      expect(getTemplate(template.id)).toBe(template)
    }
    expect(getTemplate('nonexistent')).toBe(TEMPLATES[0])
  })
})

describe('card layout', () => {
  it('fits one to three blocks in every frame and template', () => {
    for (const template of [TEMPLATES[0]!, TEMPLATES[5]!, TEMPLATES[TEMPLATES.length - 1]!]) {
      for (const frame of ['square', 'portrait', 'story'] as const) {
        for (const blocks of [sample.slice(0, 1), sample.slice(0, 2), sample]) {
          const result = layout(blocks, template.id, frame)
          expect(result.fits, `${template.id}/${frame}/${blocks.length}`).toBe(true)
        }
      }
    }
  })

  it('reconstructs the full text on every fitting block', () => {
    const result = layout(sample)
    result.blocks.forEach((plan, index) => {
      expect(linesToText(plan.arabicLines)).toBe(sample[index]!.arabic)
      expect(plan.citationLines.length).toBeGreaterThan(0)
    })
  })

  it('never slices text when it does not fit', () => {
    const long = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ')
    const result = layout([block('long', long)])
    expect(result.fits).toBe(false)
    expect(linesToText(result.blocks[0]!.arabicLines)).toBe(long)
  })

  it('honors the layout override for the feature variant', () => {
    const feature = layout(sample.slice(0, 2), DEFAULT_TEMPLATE_ID, 'portrait', 'feature')
    const classic = layout(sample.slice(0, 2), DEFAULT_TEMPLATE_ID, 'portrait', 'classic')
    expect(feature.blocks[0]!.arabicSize).toBeGreaterThan(feature.blocks[1]!.arabicSize)
    expect(classic.blocks[0]!.arabicSize).toBe(classic.blocks[1]!.arabicSize)
  })

  it('flags a card that only fits at the absolute minimum as hard to read', () => {
    // A long verse squeezes the layout down; the legibility flag must notice.
    const tight = layout([block('a', 'كلمة '.repeat(300))], 'minimal-editorial', 'square', null, arabicMeasure)
    if (!tight.fits) {
      expect(tight.blocks[0]!.arabicSize).toBeGreaterThanOrEqual(26) // hard floor held
    } else {
      expect(tight.legible).toBe(tight.blocks[0]!.arabicSize >= Math.round(26 * 1.2))
    }
    const calm = layout(sample, 'parchment-classic')
    expect(calm.legible).toBe(true)
  })

  it('uses the documented frame sizes', () => {
    expect(layout(sample.slice(0, 1), DEFAULT_TEMPLATE_ID, 'square').w).toBe(1080)
    expect(layout(sample.slice(0, 1), DEFAULT_TEMPLATE_ID, 'story').h).toBe(1920)
    expect(FRAMES.portrait.h).toBe(1350)
  })

  it('carries the source footer', () => {
    const result = layout(sample.slice(0, 1))
    expect(result.footerLines.length).toBeGreaterThan(0)
    expect(result.footerSize).toBeGreaterThan(0)
  })
})

describe('full-Quran sweep', () => {
  it('every one of the 6,236 ayat renders alone with the long-verse template', async () => {
    const failures: string[] = []
    for (const meta of SURAHS) {
      const text = await loadSurah(meta.id)
      for (let i = 0; i < text.ayat.length; i++) {
        const ayah = text.ayat[i]!
        const result = layout(
          [block(`${meta.id}:${i + 1}`, ayah)],
          'long-verse',
          'square',
          null,
          arabicMeasure,
        )
        if (!result.fits) failures.push(`${meta.id}:${i + 1} (${ayah.length})`)
        else expect(linesToText(result.blocks[0]!.arabicLines)).toBe(ayah)
      }
    }
    expect(failures, `overflow: ${failures.slice(0, 5).join(', ')}`).toEqual([])
  }, 120000)

  it('the default template only overflows on the longest verses', async () => {
    const overflows: number[] = []
    let total = 0
    for (const meta of SURAHS) {
      const text = await loadSurah(meta.id)
      for (const ayah of text.ayat) {
        total += 1
        const result = layout(
          [block(`${meta.id}`, ayah)],
          DEFAULT_TEMPLATE_ID,
          'square',
          null,
          arabicMeasure,
        )
        if (!result.fits) overflows.push([...ayah].length)
      }
    }
    expect(total).toBe(6236)
    // A tiny tail of very long verses needs the long-verse template or a
    // taller frame; anything more would mean a regression in the shrink loop.
    expect(overflows.length).toBeLessThan(total * 0.03)
  }, 120000)
})
