import {
  CIVIL_VARIANT,
  UMALQURA_MAX_YEAR,
  UMALQURA_MIN_YEAR,
  UMALQURA_VARIANT,
  VERSION_CIVIL,
  VERSION_UMALQURA,
  type HijriVariant,
} from './constants'
import { hijriToJdUmalqura, jdToHijriUmalqura, umalquraMonthLength } from './umalqura'
import { civilMonthLength, hijriToJdCivil, jdToHijriCivil } from './tabular'
import { UMALQURA_FIRST_JDN, UMALQURA_LAST_JDN } from './umalqura-data'

export type HijriDate = { year: number; month: number; day: number }

export type HijriResult =
  | {
      ok: true
      gregorian: HijriDate
      hijri: HijriDate & { monthLength: number; weekday: number }
      variant: HijriVariant
      variantVersion: string
      jdn: number
      timeZone: string
    }
  | {
      ok: false
      reason: 'invalid-gregorian' | 'invalid-hijri' | 'out-of-range' | 'invalid-variant' | 'invalid-timezone'
      details?: string
    }

function isValidGregorian(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false
  if (y < 1 || y > 9999) return false
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false
  // Pure Gregorian validation without Date (handles y 1..99 correctly, proleptic)
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const dim = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
  return d <= dim
}

export function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

export function jdnToGregorian(jdn: number): HijriDate {
  // Fliegel-Van Flandern
  let l = jdn + 68569
  const n = Math.floor((4 * l) / 146097)
  l = l - Math.floor((146097 * n + 3) / 4)
  const i = Math.floor((4000 * (l + 1)) / 1461001)
  l = l - Math.floor((1461 * i) / 4) + 31
  const j = Math.floor((80 * l) / 2447)
  const d = l - Math.floor((2447 * j) / 80)
  l = Math.floor(j / 11)
  const m = j + 2 - 12 * l
  const y = 100 * (n - 49) + i + l
  return { year: y, month: m, day: d }
}

function weekdayFromJdn(jdn: number): number {
  // 0=Sunday .. 6=Saturday; JDN 0 is Monday, so (jdn+1)%7
  return (jdn + 1) % 7
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function validateVariant(v: string): v is HijriVariant {
  return v === CIVIL_VARIANT || v === UMALQURA_VARIANT
}

export function convertGregorianToHijri(input: {
  year: number
  month: number
  day: number
  variant: string
  timeZone?: string
}): HijriResult {
  const { year, month, day, variant, timeZone } = input

  if (!validateVariant(variant)) {
    return { ok: false, reason: 'invalid-variant', details: variant }
  }
  if (timeZone && !isValidTimeZone(timeZone)) {
    return { ok: false, reason: 'invalid-timezone', details: timeZone }
  }
  if (!isValidGregorian(year, month, day)) {
    return { ok: false, reason: 'invalid-gregorian', details: `${year}-${month}-${day}` }
  }

  const jdn = gregorianToJdn(year, month, day)

  // Umm al-Qura range check via JDN bounds (exact from table)
  if (variant === UMALQURA_VARIANT) {
    if (jdn < UMALQURA_FIRST_JDN || jdn > UMALQURA_LAST_JDN) {
      return {
        ok: false,
        reason: 'out-of-range',
        details: `Umm al-Qura supports 1356-01-01 to 1500-12-30 (Gregorian 1937-03-14 to 2077-11-16)`,
      }
    }
    const h = jdToHijriUmalqura(jdn)
    if (!h) {
      return {
        ok: false,
        reason: 'out-of-range',
        details: `Umm al-Qura supports 1356-01-01 to 1500-12-30 (Gregorian 1937-03-14 to 2077-11-16)`,
      }
    }
    return {
      ok: true,
      gregorian: { year, month, day },
      hijri: { ...h, monthLength: umalquraMonthLength(h.year, h.month), weekday: weekdayFromJdn(jdn) },
      variant,
      variantVersion: VERSION_UMALQURA,
      jdn,
      timeZone: timeZone ?? 'UTC',
    }
  }

  // Civil
  const h = jdToHijriCivil(jdn)
  // Civil has wider range, but bound to realistic 1..3000 AH
  if (h.year < 1 || h.year > 3000) {
    return { ok: false, reason: 'out-of-range', details: `Civil supports 1 AH .. 3000 AH` }
  }
  return {
    ok: true,
    gregorian: { year, month, day },
    hijri: { ...h, monthLength: civilMonthLength(h.year, h.month), weekday: weekdayFromJdn(jdn) },
    variant,
    variantVersion: VERSION_CIVIL,
    jdn,
    timeZone: timeZone ?? 'UTC',
  }
}

export function convertHijriToGregorian(input: {
  year: number
  month: number
  day: number
  variant: string
  timeZone?: string
}): HijriResult {
  const { year, month, day, variant, timeZone } = input

  if (!validateVariant(variant)) {
    return { ok: false, reason: 'invalid-variant', details: variant }
  }
  if (timeZone && !isValidTimeZone(timeZone)) {
    return { ok: false, reason: 'invalid-timezone', details: timeZone }
  }
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { ok: false, reason: 'invalid-hijri', details: `${year}-${month}-${day}` }
  }
  if (month < 1 || month > 12 || day < 1) {
    return { ok: false, reason: 'invalid-hijri', details: `month/day out of range` }
  }

  let jdn: number | null
  let monthLength: number

  if (variant === UMALQURA_VARIANT) {
    if (year < UMALQURA_MIN_YEAR || year > UMALQURA_MAX_YEAR) {
      return {
        ok: false,
        reason: 'out-of-range',
        details: `Umm al-Qura supports ${UMALQURA_MIN_YEAR}-01-01 to ${UMALQURA_MAX_YEAR}-12-30`,
      }
    }
    monthLength = umalquraMonthLength(year, month)
    if (day > monthLength) {
      return { ok: false, reason: 'invalid-hijri', details: `day ${day} exceeds month length ${monthLength} for ${year}-${month}` }
    }
    jdn = hijriToJdUmalqura(year, month, day)
    if (jdn === null) return { ok: false, reason: 'invalid-hijri' }
  } else {
    if (year < 1 || year > 3000) {
      return { ok: false, reason: 'out-of-range', details: `Civil supports 1 AH .. 3000 AH` }
    }
    monthLength = civilMonthLength(year, month)
    if (monthLength === 0) return { ok: false, reason: 'invalid-hijri' }
    if (day > monthLength) {
      return { ok: false, reason: 'invalid-hijri', details: `day ${day} exceeds month length ${monthLength} for ${year}-${month} (civil leap check)` }
    }
    jdn = hijriToJdCivil(year, month, day)
  }

  const g = jdnToGregorian(jdn)
  return {
    ok: true,
    gregorian: g,
    hijri: { year, month, day, monthLength, weekday: weekdayFromJdn(jdn) },
    variant,
    variantVersion: variant === UMALQURA_VARIANT ? VERSION_UMALQURA : VERSION_CIVIL,
    jdn,
    timeZone: timeZone ?? 'UTC',
  }
}

export function getHijriMonthLength(variant: HijriVariant, year: number, month: number): number {
  return variant === UMALQURA_VARIANT ? umalquraMonthLength(year, month) : civilMonthLength(year, month)
}
