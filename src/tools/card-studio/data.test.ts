import { describe, expect, it } from 'vitest'
import { DUA_DATASET_VERSION, HISN_DUAS, duaChecksum } from './data/duas'
import { CURATED_QUOTES, QUOTE_DATASET_VERSION, quoteChecksum } from './data/quotes'
import { QURAN_DATASET_CHECKSUM, QURAN_SOURCE_MD5, SURAHS, loadSurah } from './data/quran'
import { OCCASIONS } from './data/occasions'
import { MAX_BLOCKS } from './types'

const ARABIC_SCRIPT = /[\u0600-\u06FF]/

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

describe('Quran dataset', () => {
  it('has 114 ordered suras with names and ayah counts', () => {
    expect(SURAHS).toHaveLength(114)
    SURAHS.forEach((sura, index) => {
      expect(sura.id).toBe(index + 1)
      expect(sura.nameAr.trim()).not.toBe('')
      expect(sura.nameEn.trim()).not.toBe('')
      expect(sura.ayahCount).toBeGreaterThan(0)
    })
  })

  it('loads every sura with exact ayah counts and no empty verses', async () => {
    let total = 0
    for (const meta of SURAHS) {
      const text = await loadSurah(meta.id)
      expect(text.surah).toBe(meta.id)
      expect(text.ayat).toHaveLength(meta.ayahCount)
      for (const ayah of text.ayat) {
        expect(ayah.length).toBeGreaterThan(0)
        expect(ayah.trim()).toBe(ayah)
      }
      total += text.ayat.length
    }
    expect(total).toBe(6236)
  })

  it('separates the basmala for every sura except 1 and 9', async () => {
    const canonical = (await loadSurah(1)).ayat[0]!
    const body = canonical.slice(canonical.indexOf(' ') + 1)
    expect(body.length).toBeGreaterThan(10)
    for (const meta of SURAHS) {
      const text = await loadSurah(meta.id)
      if (meta.id === 1 || meta.id === 9) {
        expect(text.basmala).toBeNull()
      } else {
        expect(text.basmala).not.toBeNull()
        expect(text.basmala!.endsWith(body)).toBe(true)
        expect(text.ayat[0]!.startsWith(body)).toBe(false)
      }
    }
  })

  it('reconstructs the pinned source checksum', async () => {
    const lines: string[] = []
    for (const meta of SURAHS) {
      const text = await loadSurah(meta.id)
      text.ayat.forEach((ayah, index) => {
        const body = index === 0 && text.basmala ? `${text.basmala} ${ayah}` : ayah
        lines.push(`${text.surah}|${index + 1}|${body}`)
      })
    }
    expect(lines).toHaveLength(6236)
    expect(fnv1a(lines.join('\n'))).toBe(QURAN_DATASET_CHECKSUM)
    expect(QURAN_SOURCE_MD5).toBe('7410caf5dc5b337de917b47ed887e3cb')
  })

  it('rejects unknown surah ids', async () => {
    await expect(loadSurah(115)).rejects.toThrow('unknown-surah')
  })
})

describe('Dua starter set', () => {
  it('is well-formed and uniquely identified', () => {
    expect(HISN_DUAS.length).toBeGreaterThanOrEqual(10)
    const ids = new Set<string>()
    for (const dua of HISN_DUAS) {
      expect(dua.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(ids.has(dua.id)).toBe(false)
      ids.add(dua.id)
      expect(ARABIC_SCRIPT.test(dua.arabic)).toBe(true)
      expect(dua.titleAr.trim()).not.toBe('')
      expect(dua.titleEn.trim()).not.toBe('')
      expect(dua.source.trim()).not.toBe('')
      expect(dua.hisnRef.trim()).not.toBe('')
    }
    expect(DUA_DATASET_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('carries an Arabic book reference for every entry', () => {
    // A translation appears in the English UI only. `source` is exempt because
    // it is transliterated proper nouns ("Bukhari 6306"), but `hisnRef` is
    // prose, so the Arabic surface needs its own string or the row would mix
    // languages. See AGENTS.md "one language at a time".
    for (const dua of HISN_DUAS) {
      expect(dua.hisnRefAr.trim(), `${dua.id}: hisnRefAr is empty`).not.toBe('')
      expect(ARABIC_SCRIPT.test(dua.hisnRefAr), `${dua.id}: hisnRefAr is not Arabic`).toBe(
        true,
      )
      expect(dua.hisnRefAr).not.toBe(dua.hisnRef)
    }
  })

  it('checksum is pinned (updating Arabic text must update this value)', () => {
    expect(duaChecksum()).toBe('fnv1a-7da9aff7')
  })
})

describe('Occasion collections', () => {
  it('are curated combinations that never exceed the block limit', () => {
    expect(OCCASIONS.length).toBeGreaterThanOrEqual(8)
    for (const occasion of OCCASIONS) {
      expect(occasion.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(occasion.nameEn.trim()).not.toBe('')
      expect(occasion.nameAr.trim()).not.toBe('')
      expect(occasion.blocks.length).toBeGreaterThan(0)
      expect(occasion.blocks.length).toBeLessThanOrEqual(MAX_BLOCKS)
    }
  })

  it('only references dua ids and ayah ranges that exist in the datasets', async () => {
    for (const occasion of OCCASIONS) {
      for (const block of occasion.blocks) {
        if (block.kind === 'dua') {
          expect(HISN_DUAS.some((entry) => entry.id === block.duaId), `${occasion.id}:${block.duaId}`).toBe(true)
        } else if (block.kind === 'ayah') {
          const meta = SURAHS[block.surah - 1]
          expect(meta, `${occasion.id}:${block.surah}`).toBeDefined()
          const text = await loadSurah(block.surah)
          expect(block.ayahEnd).toBeLessThanOrEqual(text.ayat.length)
        }
      }
    }
  })

  it('never smuggles Quran text through the dua dataset', () => {
    // The Quranic adhkar were excluded so sacred text has one source of record.
    const quranicIds = ['ayat-al-kursi', 'surah-ikhlas', 'surah-falaq', 'surah-nas']
    for (const id of quranicIds) {
      expect(HISN_DUAS.some((dua) => dua.id === id), id).toBe(false)
    }
  })
})

describe('Curated quotes', () => {
  it('carries full attribution and a verification flag', () => {
    expect(CURATED_QUOTES.length).toBeGreaterThan(0)
    for (const quote of CURATED_QUOTES) {
      expect(quote.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(ARABIC_SCRIPT.test(quote.arabic)).toBe(true)
      expect(quote.authorAr.trim()).not.toBe('')
      expect(quote.authorEn.trim()).not.toBe('')
      expect(quote.workAr.trim()).not.toBe('')
      expect(quote.workEn.trim()).not.toBe('')
      // Reviewers flip this only after character-level verification (METHODOLOGY.md §6).
      expect(typeof quote.verified).toBe('boolean')
    }
    expect(QUOTE_DATASET_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('checksum is pinned', () => {
    expect(quoteChecksum()).toBe('fnv1a-fe11aa28')
  })
})
