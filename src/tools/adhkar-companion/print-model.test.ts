import { describe, expect, it } from 'vitest'
import { DHIKR } from './adhkar-data'
import { printModel } from './print-model'

describe('print model', () => {
  it('covers every item in order with locale titles', () => {
    const m = printModel(DHIKR, {
      setName: 'Morning',
      dateISO: '2026-09-08',
      locale: 'en',
      meanings: true,
      sources: true,
      cover: 'band',
      layout: 'booklet',
    })
    expect(m.count).toBe(DHIKR.length)
    expect(m.rows).toHaveLength(DHIKR.length)
    expect(m.rows.map((r) => r.id)).toEqual(DHIKR.map((d) => d.id))
    expect(m.rows[0]!.title).toBe(DHIKR[0]!.titleEn)
    expect(m.datasetVersion).toMatch(/^\d+\.\d+\.\d+$/)
    expect(m.dateISO).toBe('2026-09-08')
  })

  it('uses Arabic titles and meanings for ar locale', () => {
    const m = printModel(DHIKR.slice(0, 2), {
      setName: 'الصباح',
      dateISO: '2026-09-08',
      locale: 'ar',
      meanings: true,
      sources: true,
      cover: 'light',
      layout: 'checklist',
    })
    expect(m.rows[0]!.title).toBe(DHIKR[0]!.titleAr)
    expect(m.rows[0]!.meaning).toBe(DHIKR[0]!.meaningAr)
  })

  it('toggles strip exactly their fields', () => {
    const full = printModel(DHIKR.slice(0, 1), {
      setName: 'x',
      dateISO: '2026-09-08',
      locale: 'en',
      meanings: true,
      sources: true,
      cover: 'band',
      layout: 'booklet',
    })
    expect(full.rows[0]!.meaning).not.toBe('')
    expect(full.rows[0]!.source).not.toBe('')
    const bare = printModel(DHIKR.slice(0, 1), {
      setName: 'x',
      dateISO: '2026-09-08',
      locale: 'en',
      meanings: false,
      sources: false,
      cover: 'band',
      layout: 'booklet',
    })
    expect(bare.rows[0]!.meaning).toBe('')
    expect(bare.rows[0]!.source).toBe('')
    // Untouched by toggles:
    expect(bare.rows[0]!.arabic).toBe(full.rows[0]!.arabic)
    expect(bare.rows[0]!.target).toBe(full.rows[0]!.target)
  })

  it('empty set yields a cover-only model', () => {
    const m = printModel([], {
      setName: 'Mine',
      dateISO: '2026-09-08',
      locale: 'en',
      meanings: true,
      sources: true,
      cover: 'band',
      layout: 'booklet',
    })
    expect(m.count).toBe(0)
    expect(m.rows).toEqual([])
  })

  it('passes cover and layout through for the booklet', () => {
    const m = printModel(DHIKR.slice(0, 3), {
      setName: 'Morning',
      dateISO: '2026-09-08',
      locale: 'en',
      meanings: false,
      sources: false,
      cover: 'light',
      layout: 'checklist',
    })
    expect(m.cover).toBe('light')
    expect(m.layout).toBe('checklist')
    // One tick-box per row, in order:
    expect(m.rows.map((r) => r.id)).toEqual(DHIKR.slice(0, 3).map((d) => d.id))
  })
})
