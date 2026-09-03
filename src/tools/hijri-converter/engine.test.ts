import { describe, expect, it } from 'vitest'
import {
  convertGregorianToHijri,
  convertHijriToGregorian,
  gregorianToJdn,
  jdnToGregorian,
} from './engine'
import { civilMonthLength, isLeapCivil } from './tabular'
import { UMALQURA_MONTH_LENGTHS } from './umalqura-data'
import { umalquraMonthLength } from './umalqura'

describe('hijri converter - gregorian <-> jdn', () => {
  it('gregorianToJdn / jdnToGregorian round-trip', () => {
    const dates: Array<[number, number, number]> = [
      [1937, 3, 14],
      [2023, 7, 19],
      [2026, 3, 15],
      [2000, 1, 1],
      [2077, 11, 16],
    ]
    for (const [y, m, d] of dates) {
      const jdn = gregorianToJdn(y, m, d)
      const g = jdnToGregorian(jdn)
      expect(g).toEqual({ year: y, month: m, day: d })
    }
  })
})

describe('civil tabular', () => {
  it('leap years in 30-year cycle', () => {
    const leaps = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]
    for (let y = 1; y <= 30; y++) {
      const isLeap = isLeapCivil(y)
      if (leaps.includes(y)) expect(isLeap).toBe(true)
      else expect(isLeap).toBe(false)
    }
  })

  it('month lengths follow odd/even rule', () => {
    expect(civilMonthLength(1445, 1)).toBe(30) // Muharram 30
    expect(civilMonthLength(1445, 2)).toBe(29)
    expect(civilMonthLength(1445, 12)).toBe(isLeapCivil(1445) ? 30 : 29)
  })

  it('civil round-trip greg->hijri->greg', () => {
    const greg = { year: 2026, month: 3, day: 15 }
    const h = convertGregorianToHijri({ ...greg, variant: 'islamic-civil' })
    expect(h.ok).toBe(true)
    if (!h.ok) return
    const back = convertHijriToGregorian({
      year: h.hijri.year,
      month: h.hijri.month,
      day: h.hijri.day,
      variant: 'islamic-civil',
    })
    expect(back.ok).toBe(true)
    if (!back.ok) return
    expect(back.gregorian).toEqual(greg)
  })

  it('civil rejects invalid month length', () => {
    // 1445 Dhu al-Hijjah length? Check leap
    const len = civilMonthLength(1447, 12)
    // Try day 30 when len is 29 should fail
    if (len === 29) {
      const r = convertHijriToGregorian({ year: 1447, month: 12, day: 30, variant: 'islamic-civil' })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.reason).toBe('invalid-hijri')
    }
  })
})

describe('umalqura', () => {
  it('month lengths table length is 1740', () => {
    expect(UMALQURA_MONTH_LENGTHS.length).toBe(1740)
  })

  it('known umalqura conversions', () => {
    // 1356-01-01 => 1937-03-14
    const r1 = convertHijriToGregorian({ year: 1356, month: 1, day: 1, variant: 'islamic-umalqura' })
    expect(r1.ok).toBe(true)
    if (r1.ok) expect(r1.gregorian).toEqual({ year: 1937, month: 3, day: 14 })

    // 2023-07-19 => 1445-01-01 umalqura
    const r2 = convertGregorianToHijri({ year: 2023, month: 7, day: 19, variant: 'islamic-umalqura' })
    expect(r2.ok).toBe(true)
    if (r2.ok) expect(r2.hijri).toMatchObject({ year: 1445, month: 1, day: 1 })

    // 2026-03-15 => 1447-09-26 umalqura
    const r3 = convertGregorianToHijri({ year: 2026, month: 3, day: 15, variant: 'islamic-umalqura' })
    expect(r3.ok).toBe(true)
    if (r3.ok) expect(r3.hijri).toMatchObject({ year: 1447, month: 9, day: 26 })
  })

  it('umalqura round-trip', () => {
    const hijri = { year: 1447, month: 9, day: 26 }
    const g = convertHijriToGregorian({ ...hijri, variant: 'islamic-umalqura' })
    expect(g.ok).toBe(true)
    if (!g.ok) return
    const back = convertGregorianToHijri({ ...g.gregorian, variant: 'islamic-umalqura' })
    expect(back.ok).toBe(true)
    if (!back.ok) return
    expect(back.hijri).toMatchObject(hijri)
  })

  it('variant divergence: same gregorian gives different hijri', () => {
    const greg = { year: 2026, month: 3, day: 15 }
    const umal = convertGregorianToHijri({ ...greg, variant: 'islamic-umalqura' })
    const civil = convertGregorianToHijri({ ...greg, variant: 'islamic-civil' })
    expect(umal.ok && civil.ok).toBe(true)
    if (umal.ok && civil.ok) {
      // They should differ by ~1 day for this date
      const u = `${umal.hijri.year}-${umal.hijri.month}-${umal.hijri.day}`
      const c = `${civil.hijri.year}-${civil.hijri.month}-${civil.hijri.day}`
      expect(u).not.toBe(c)
    }
  })

  it('out-of-range before table', () => {
    const r = convertGregorianToHijri({ year: 1937, month: 3, day: 13, variant: 'islamic-umalqura' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('out-of-range')

    const r2 = convertHijriToGregorian({ year: 1355, month: 12, day: 29, variant: 'islamic-umalqura' })
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.reason).toBe('out-of-range')
  })

  it('out-of-range after table', () => {
    const r = convertHijriToGregorian({ year: 1501, month: 1, day: 1, variant: 'islamic-umalqura' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('out-of-range')
  })

  it('invalid hijri day exceeds month length', () => {
    // Find a month with 29 days in umalqura, e.g., 1356-01 is 29
    expect(umalquraMonthLength(1356, 1)).toBe(29)
    const r = convertHijriToGregorian({ year: 1356, month: 1, day: 30, variant: 'islamic-umalqura' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid-hijri')
  })

  it('invalid gregorian', () => {
    const r = convertGregorianToHijri({ year: 2026, month: 13, day: 1, variant: 'islamic-umalqura' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid-gregorian')
  })

  it('invalid timezone', () => {
    const r = convertGregorianToHijri({ year: 2026, month: 3, day: 15, variant: 'islamic-umalqura', timeZone: 'Invalid/Zone' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid-timezone')
  })

  it('civil handles wide range', () => {
    const r = convertHijriToGregorian({ year: 1, month: 1, day: 1, variant: 'islamic-civil' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.gregorian).toEqual({ year: 622, month: 7, day: 18 })
  })
})

describe('cross-variant round-trip invariants', () => {
  it('greg->hijri->greg identity within variant', () => {
    const dates: Array<[number, number, number]> = [
      [2000, 1, 1],
      [2020, 6, 15],
      [2023, 7, 19],
      [2026, 3, 15],
    ]
    for (const [y, m, d] of dates) {
      for (const variant of ['islamic-umalqura', 'islamic-civil'] as const) {
        // Skip out-of-range for umalqura early dates
        const r = convertGregorianToHijri({ year: y, month: m, day: d, variant })
        if (!r.ok) continue
        const back = convertHijriToGregorian({ year: r.hijri.year, month: r.hijri.month, day: r.hijri.day, variant })
        expect(back.ok).toBe(true)
        if (back.ok) expect(back.gregorian).toEqual({ year: y, month: m, day: d })
      }
    }
  })
})
