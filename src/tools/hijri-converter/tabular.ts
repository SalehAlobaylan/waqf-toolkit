import { CIVIL_EPOCH_JD } from './constants'

/**
 * Tabular (civil) Hijri calendar — 30-year cycle with 11 leap years.
 *
 * Leap years: 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 in each 30-year cycle.
 * Test: ((11*year + 14) % 30) < 11
 *
 * Month lengths: odd months 30, even 29, except Dhu al-Hijjah 30 in leap.
 */

export function isLeapCivil(year: number): boolean {
  return ((11 * year + 14) % 30) < 11
}

export function civilMonthLength(year: number, month: number): number {
  if (month < 1 || month > 12) return 0
  if (month % 2 === 1) return 30
  if (month !== 12) return 29
  return isLeapCivil(year) ? 30 : 29
}

export function civilYearLength(year: number): number {
  return isLeapCivil(year) ? 355 : 354
}

/**
 * Hijri (tabular) -> JDN at noon UTC.
 * Formula: jd = d + ceil(29.5*(m-1)) + (y-1)*354 + floor((3+11*y)/30) + epoch -1
 */
export function hijriToJdCivil(year: number, month: number, day: number): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    CIVIL_EPOCH_JD -
    1
  )
}

/**
 * JDN at noon -> Hijri (tabular) year/month/day.
 * Inverse via approximation + correction.
 */
export function jdToHijriCivil(jdn: number): { year: number; month: number; day: number } {
  // Approximate year — 30-year cycle = 10631 days (354*30+11)
  const year = Math.floor((30 * (jdn - CIVIL_EPOCH_JD) + 10646) / 10631)
  // Clamp and find exact year start
  let y = year
  // Adjust year to ensure jdn >= start of y and < start of y+1
  while (hijriToJdCivil(y + 1, 1, 1) <= jdn) y += 1
  while (hijriToJdCivil(y, 1, 1) > jdn) y -= 1

  // Find month
  let m = 1
  while (m <= 12) {
    const start = hijriToJdCivil(y, m, 1)
    const next = m < 12 ? hijriToJdCivil(y, m + 1, 1) : hijriToJdCivil(y + 1, 1, 1)
    if (jdn >= start && jdn < next) {
      const d = jdn - start + 1
      return { year: y, month: m, day: d }
    }
    m += 1
  }
  // Fallback — should not happen
  return { year: y, month: 12, day: jdn - hijriToJdCivil(y, 12, 1) + 1 }
}
