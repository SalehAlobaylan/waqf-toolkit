import { describe, expect, it } from 'vitest'
import { sanitizeBlocks, sanitizeStyle } from './storage'
import { DEFAULT_STYLE, MAX_BLOCKS } from './types'

describe('style sanitization (untrusted localStorage)', () => {
  it('falls back to defaults for junk', () => {
    expect(sanitizeStyle(null)).toEqual(DEFAULT_STYLE)
    expect(sanitizeStyle('nope')).toEqual(DEFAULT_STYLE)
    expect(sanitizeStyle({})).toEqual(DEFAULT_STYLE)
  })

  it('keeps valid values and drops unknown ones', () => {
    const style = sanitizeStyle({
      template: 'night-mushaf',
      frame: 'story',
      layout: 'feature',
      format: 'webp',
      resolution: 'compact',
      digits: 'arab',
    })
    expect(style).toEqual({
      template: 'night-mushaf',
      frame: 'story',
      layout: 'feature',
      format: 'webp',
      resolution: 'compact',
      digits: 'arab',
    })
  })

  it('rejects an unknown template id', () => {
    expect(sanitizeStyle({ template: 'evil-template' }).template).toBe(DEFAULT_STYLE.template)
  })

  it('preserves an explicit "follow the template" layout (null)', () => {
    expect(sanitizeStyle({ layout: null }).layout).toBeNull()
    expect(sanitizeStyle({ layout: 'nonsense' }).layout).toBe('classic')
  })
})

describe('block sanitization (untrusted localStorage)', () => {
  it('keeps well-formed blocks of every kind', () => {
    const blocks = sanitizeBlocks([
      { id: 'a', kind: 'ayah', surah: 2, ayahStart: 255, ayahEnd: 255 },
      { id: 'b', kind: 'dua', duaId: 'sayyid-istighfar' },
      { id: 'c', kind: 'quote', quoteId: 'ibn-qayyim-heart-bird' },
    ])
    expect(blocks.map((block) => block.kind)).toEqual(['ayah', 'dua', 'quote'])

    // A manual quote is the fourth kind of entry and must survive on its own.
    expect(
      sanitizeBlocks([
        { id: 'd', kind: 'quote', manual: { text: 't', author: 'a', work: 'w', locator: 'p' } },
      ]),
    ).toEqual([{ id: 'd', kind: 'quote', manual: { text: 't', author: 'a', work: 'w', locator: 'p' } }])
  })

  it('drops malformed entries instead of trusting them', () => {
    const blocks = sanitizeBlocks([
      null,
      'string',
      { kind: 'ayah', surah: 2, ayahStart: 1, ayahEnd: 1 }, // no id
      { id: 'x', kind: 'ayah', surah: 999, ayahStart: 1, ayahEnd: 1 }, // surah out of range
      { id: 'y', kind: 'ayah', surah: 2, ayahStart: 1.5, ayahEnd: 2 }, // not an integer
      { id: 'z', kind: 'dua' }, // no duaId
      { id: 'w', kind: 'quote', manual: { text: '', author: 'a', work: 'w', locator: 'p' } }, // empty text
      { id: 'v', kind: 'quote', manual: { text: 't', author: 'a', work: 'w' } }, // missing locator
    ])
    expect(blocks).toEqual([])
  })

  it('never returns more than the block limit', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `b${i}`,
      kind: 'dua',
      duaId: `dua-${i}`,
    }))
    expect(sanitizeBlocks(many)).toHaveLength(MAX_BLOCKS)
  })

  it('rejects non-arrays and oversized manual text', () => {
    expect(sanitizeBlocks({ blocks: [] })).toEqual([])
    expect(
      sanitizeBlocks([
        {
          id: 'a',
          kind: 'quote',
          manual: { text: 'x'.repeat(5000), author: 'a', work: 'w', locator: 'p' },
        },
      ]),
    ).toEqual([])
  })
})
