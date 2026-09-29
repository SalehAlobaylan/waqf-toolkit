import { describe, expect, it } from 'vitest'
import { addBlock, canAddBlock, canRedo, canUndo, historyFrom, manualQuoteBlock, moveBlock, reducer, removeBlock } from './blocks'
import {
  buildJsonExport,
  buildProjectFile,
  buildTextExport,
  decodeDeepLink,
  encodeDeepLink,
  parseProjectFile,
  verifyPayload,
} from './export'
import {
  buildCardFooter,
  resolveBlocks,
  usedDatasetIds,
  usedDatasetRevisions,
  validateManualQuote,
} from './resolve'
import { HISN_DUAS } from '../data/duas'
import { CURATED_QUOTES } from '../data/quotes'
import { SURAHS, type SurahText } from '../data/quran'
import { DEFAULT_STYLE, type CardBlock } from '../types'
import type { CardDoc } from './blocks'

const quran: Record<number, SurahText> = {
  2: { surah: 2, basmala: 'basmala prefix', ayat: ['first ayah text', 'second ayah text'] },
}

const ayah = (id: string, start: number, end = start): CardBlock => ({ id, kind: 'ayah', surah: 2, ayahStart: start, ayahEnd: end })
const dua = (id: string): CardBlock => ({ id, kind: 'dua', duaId: id })

describe('block editing', () => {
  it('enforces the limit and rejects duplicates', () => {
    const full: CardBlock[] = [ayah('a', 1), ayah('b', 2), ayah('c', 3)]
    expect(canAddBlock(full, ayah('d', 4))).toEqual({ ok: false, reason: 'limit' })
    expect(canAddBlock([ayah('a', 2)], ayah('b', 2))).toEqual({ ok: false, reason: 'duplicate' })
    expect(addBlock([ayah('a', 2)], ayah('b', 2))).toHaveLength(1)
  })

  it('moves and removes', () => {
    const blocks = [ayah('a', 1), ayah('b', 2), ayah('c', 3)]
    expect(moveBlock(blocks, 'b', -1).map((b) => b.id)).toEqual(['b', 'a', 'c'])
    expect(removeBlock(blocks, 'b').map((b) => b.id)).toEqual(['a', 'c'])
  })

  it('supports undo/redo through the reducer', () => {
    let state = historyFrom({ blocks: [], style: DEFAULT_STYLE })
    state = reducer(state, { type: 'add', block: dua('sayyid-istighfar') })
    expect(state.present.blocks).toHaveLength(1)
    expect(canUndo(state)).toBe(true)
    state = reducer(state, { type: 'undo' })
    expect(state.present.blocks).toHaveLength(0)
    expect(canRedo(state)).toBe(true)
    state = reducer(state, { type: 'redo' })
    expect(state.present.blocks).toHaveLength(1)
  })

  it('builds a manual quote block with trimmed fields', () => {
    const block = manualQuoteBlock({ text: '  x ', author: ' a ', work: ' w ', locator: ' p ' }, 'id')
    expect(block).toMatchObject({ kind: 'quote', manual: { text: 'x', author: 'a', work: 'w', locator: 'p' } })
  })
})

describe('resolveBlocks', () => {
  it('returns null while an ayah is loading', () => {
    expect(resolveBlocks([ayah('a', 1)], { locale: 'en', digits: 'latn', quran: {} })).toBeNull()
  })

  it('builds localized ayah citations with digit preference', () => {
    const en = resolveBlocks([ayah('a', 2)], { locale: 'en', digits: 'latn', quran })
    expect(en![0]!.citation).toContain(SURAHS[1]!.nameEn)
    expect(en![0]!.citation).toContain('2:2')
    const ar = resolveBlocks([ayah('a', 2)], { locale: 'ar', digits: 'arab', quran })
    expect(ar![0]!.citation).toMatch(/[\u0660-\u0669]:[\u0660-\u0669]/)
  })

  it('includes the basmala only when the range starts at ayah one', () => {
    expect(resolveBlocks([ayah('a', 1, 2)], { locale: 'en', digits: 'latn', quran })![0]!.basmala).toBe('basmala prefix')
    expect(resolveBlocks([ayah('a', 2)], { locale: 'en', digits: 'latn', quran })![0]!.basmala).toBeNull()
  })

  it('resolves dua and quote blocks with provenance', () => {
    const d = HISN_DUAS[0]!
    const q = CURATED_QUOTES[0]!
    const resolved = resolveBlocks([dua(d.id), { id: 'q', kind: 'quote', quoteId: q.id }], { locale: 'en', digits: 'latn', quran })!
    expect(resolved[0]!.provenance).toMatchObject({ kind: 'dua', id: d.id })
    expect(resolved[1]!.citation).toContain(q.authorEn)
  })

  it('marks manual quotes unverified', () => {
    const block = manualQuoteBlock({ text: 't', author: 'A', work: 'W', locator: 'P' }, 'm')
    const resolved = resolveBlocks([block], { locale: 'en', digits: 'latn', quran })!
    expect(resolved[0]!.unverified).toBe(true)
  })
})

describe('resolve helpers', () => {
  it('validates manual quote fields', () => {
    expect(validateManualQuote({ text: '', author: '', work: '', locator: '' })).toBe(false)
    expect(validateManualQuote({ text: 'x', author: 'a', work: 'w', locator: '' })).toBe(false)
    expect(validateManualQuote({ text: 'x', author: 'a', work: 'w', locator: 'p' })).toBe(true)
  })

  it('builds a footer listing the sources used', () => {
    const blocks = resolveBlocks([ayah('a', 1), dua('sayyid-istighfar')], { locale: 'en', digits: 'latn', quran })!
    const footer = buildCardFooter(blocks, 'en')
    expect(footer).toContain('Tanzil')
    expect(footer).toContain('Hisn al-Muslim')
    expect(footer).toContain('Not a mushaf')
  })

  it('tracks which datasets a card depends on', () => {
    const blocks = resolveBlocks([dua('sayyid-istighfar')], { locale: 'en', digits: 'latn', quran })!
    const ids = usedDatasetIds(blocks)
    expect(ids).toHaveLength(1)
    const revisions = usedDatasetRevisions(blocks)
    expect(Object.values(revisions)[0]).toContain('fnv1a')
  })
})

describe('project file and deep link', () => {
  const doc: CardDoc = {
    blocks: [ayah('a', 255), dua('sayyid-istighfar')],
    style: { ...DEFAULT_STYLE, template: 'night-mushaf', layout: 'feature', frame: 'story' },
  }

  it('round-trips a project file', () => {
    const file = buildProjectFile(doc, '2026-09-13T00:00:00.000Z')
    const parsed = parseProjectFile(JSON.parse(JSON.stringify(file)))
    expect('error' in parsed).toBe(false)
    if ('error' in parsed) return
    expect(parsed.doc.blocks).toHaveLength(2)
    expect(parsed.doc.style.template).toBe('night-mushaf')
    expect(parsed.doc.style.frame).toBe('story')
  })

  it('rejects a foreign or malformed project', () => {
    expect(parseProjectFile({ tool: 'something-else' })).toEqual({ error: 'shape' })
    expect(parseProjectFile(null)).toEqual({ error: 'shape' })
  })

  it('round-trips a deep link', () => {
    const encoded = encodeDeepLink(doc)
    const decoded = decodeDeepLink(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.template).toBe('night-mushaf')
    expect(decoded!.layout).toBe('feature')
    expect(decoded!.frame).toBe('story')
    expect(decoded!.blocks).toHaveLength(2)
  })

  it('drops manual quotes from share links (they are local)', () => {
    const localDoc: CardDoc = {
      blocks: [manualQuoteBlock({ text: 'secret', author: 'A', work: 'W', locator: 'P' }, 'm')],
      style: DEFAULT_STYLE,
    }
    const encoded = encodeDeepLink(localDoc)
    expect(encoded).not.toContain('secret')
    expect(decodeDeepLink(encoded)).toBeNull() // no shareable blocks
  })

  it('encodes a verify payload that mirrors the link', () => {
    expect(verifyPayload(doc)).toBe(encodeDeepLink(doc))
  })
})

describe('json + text exports', () => {
  const blocks = resolveBlocks([ayah('a', 1, 2), dua('sayyid-istighfar')], { locale: 'en', digits: 'latn', quran })!
  const footer = buildCardFooter(blocks, 'en')

  it('text export carries citations and the footer', () => {
    const text = buildTextExport(blocks, footer)
    expect(text).toContain(blocks[0]!.citation)
    expect(text).toContain(footer)
  })

  it('json export retains provenance and dataset revisions', () => {
    const json = JSON.parse(buildJsonExport({ blocks, style: DEFAULT_STYLE, footer, locale: 'en', generatedAt: '2026-09-13T00:00:00.000Z' })) as {
      blocks: Array<Record<string, unknown>>
      datasets: Record<string, string>
    }
    expect(json.blocks[0]).toMatchObject({ kind: 'ayah', surah: 2, ayahStart: 1, ayahEnd: 2 })
    expect(json.datasets).toHaveProperty('card-studio.quran.uthmani')
  })
})
