import { describe, expect, it } from 'vitest'
import { DHIKR } from './adhkar-data'
import {
  dayKeyFromMs,
  decrement,
  filterDhikr,
  increment,
  isDone,
  nextIncomplete,
  searchDhikr,
  shouldResetDay,
  todayProgress,
  validateCustomDraft,
} from './engine'
import type { CustomDhikr } from './types'

const customEvening: CustomDhikr = {
  id: 'custom-abc',
  sets: ['evening'],
  titleEn: 'My dhikr',
  titleAr: 'ذكر خاص',
  arabic: 'ذكر خاص للاختبار',
  meaningEn: '',
  meaningAr: '',
  target: 5,
  source: 'Yours — kept on this device',
  hisnRef: 'Custom',
  custom: true,
}

describe('adhkar engine - counting', () => {
  it('increments and caps at target', () => {
    expect(increment(0, 3)).toBe(1)
    expect(increment(2, 3)).toBe(3)
    expect(increment(3, 3)).toBe(3)
    expect(increment(99, 100)).toBe(100)
    expect(increment(100, 100)).toBe(100)
  })

  it('floors at zero', () => {
    expect(decrement(0)).toBe(0)
    expect(decrement(2)).toBe(1)
    expect(decrement(-4)).toBe(0)
  })

  it('handles non-finite input safely', () => {
    expect(increment(NaN, 3)).toBe(1)
    expect(decrement(NaN)).toBe(0)
    expect(isDone(3, 3)).toBe(true)
    expect(isDone(2, 3)).toBe(false)
  })
})

describe('adhkar engine - day boundary', () => {
  it('formats a local day key', () => {
    expect(dayKeyFromMs(new Date(2026, 8, 8, 12, 0, 0).getTime())).toBe('2026-09-08')
  })

  it('resets only on day change', () => {
    expect(shouldResetDay('2026-09-07', '2026-09-08')).toBe(true)
    expect(shouldResetDay('2026-09-08', '2026-09-08')).toBe(false)
  })
})

describe('adhkar engine - sets and search', () => {
  it('morning set excludes evening-only items and vice versa', () => {
    const morning = filterDhikr(DHIKR, 'morning').map((d) => d.id)
    const evening = filterDhikr(DHIKR, 'evening').map((d) => d.id)
    expect(morning).toContain('asbahna')
    expect(morning).not.toContain('amsayna')
    expect(evening).toContain('amsayna')
    expect(evening).not.toContain('asbahna')
    expect(filterDhikr(DHIKR, 'all')).toHaveLength(DHIKR.length)
    expect(filterDhikr(DHIKR, 'custom')).toHaveLength(0)
  })

  it('custom additions join the sets they were assigned to', () => {
    const items = [...DHIKR, customEvening]
    expect(filterDhikr(items, 'evening').map((d) => d.id)).toContain('custom-abc')
    expect(filterDhikr(items, 'morning').map((d) => d.id)).not.toContain('custom-abc')
    expect(filterDhikr(items, 'all').map((d) => d.id)).not.toContain('custom-abc')
    expect(filterDhikr(items, 'custom').map((d) => d.id)).toEqual(['custom-abc'])
  })

  it('search matches arabic substring or titles', () => {
    expect(searchDhikr(DHIKR, 'الكرسي').map((d) => d.id)).toEqual(['ayat-al-kursi'])
    expect(searchDhikr(DHIKR, 'Kursi').map((d) => d.id)).toEqual(['ayat-al-kursi'])
    expect(searchDhikr(DHIKR, '   ')).toHaveLength(DHIKR.length)
    expect(searchDhikr(DHIKR, 'zzz-no-match')).toHaveLength(0)
  })
})

describe('adhkar engine - progress', () => {
  it('empty counts give zero progress', () => {
    const p = todayProgress(DHIKR, {})
    expect(p.done).toBe(0)
    expect(p.total).toBe(DHIKR.length)
    expect(p.counted).toBe(0)
    expect(p.percent).toBe(0)
    expect(p.prescribed).toBeGreaterThan(200)
  })

  it('partial counts accumulate capped at target', () => {
    const p = todayProgress(DHIKR, { 'subhanallah-33': 40, 'ayat-al-kursi': 1 })
    expect(p.done).toBe(2)
    // 33 capped (not 40) + 1
    expect(p.counted).toBe(34)
  })

  it('nextIncomplete wraps and stops when all done', () => {
    const items = filterDhikr(DHIKR, 'morning')
    const first = nextIncomplete(items, {}, null)
    expect(first).toBe(items[0]!.id)
    const after = nextIncomplete(items, { [items[0]!.id]: 9999 }, items[0]!.id)
    expect(after).toBe(items[1]!.id)
    const allDone = Object.fromEntries(items.map((i) => [i.id, i.target]))
    expect(nextIncomplete(items, allDone, items[0]!.id)).toBeNull()
  })
})

describe('adhkar engine - custom drafts', () => {
  it('rejects empty arabic and bad targets', () => {
    expect(
      validateCustomDraft({ arabic: '  ', meaningEn: '', meaningAr: '', target: 3, set: 'both' }),
    ).toBe('empty-arabic')
    expect(
      validateCustomDraft({ arabic: 'ذكر', meaningEn: '', meaningAr: '', target: 0, set: 'both' }),
    ).toBe('bad-target')
    expect(
      validateCustomDraft({ arabic: 'ذكر', meaningEn: '', meaningAr: '', target: 3.5, set: 'both' }),
    ).toBe('bad-target')
    expect(
      validateCustomDraft({ arabic: 'ذكر', meaningEn: '', meaningAr: '', target: 33, set: 'morning' }),
    ).toBeNull()
  })
})
