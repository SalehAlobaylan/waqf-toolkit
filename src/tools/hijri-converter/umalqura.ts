import { UMALQURA_MAX_YEAR, UMALQURA_MIN_YEAR } from './constants'
import {
  UMALQURA_CUM_STARTS,
  UMALQURA_MONTH_LENGTHS,
} from './umalqura-data'

function indexFor(year: number, month: number): number {
  return (year - UMALQURA_MIN_YEAR) * 12 + (month - 1)
}

export function umalquraMonthLength(year: number, month: number): number {
  if (year < UMALQURA_MIN_YEAR || year > UMALQURA_MAX_YEAR) return 0
  if (month < 1 || month > 12) return 0
  return UMALQURA_MONTH_LENGTHS[indexFor(year, month)]
}

export function isValidUmalquraDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (year < UMALQURA_MIN_YEAR || year > UMALQURA_MAX_YEAR) return false
  if (month < 1 || month > 12) return false
  const len = umalquraMonthLength(year, month)
  return day >= 1 && day <= len
}

export function hijriToJdUmalqura(year: number, month: number, day: number): number | null {
  if (!isValidUmalquraDate(year, month, day)) return null
  const idx = indexFor(year, month)
  const start = UMALQURA_CUM_STARTS[idx]
  return start + (day - 1)
}

export function jdToHijriUmalqura(jdn: number): { year: number; month: number; day: number } | null {
  const first = UMALQURA_CUM_STARTS[0]
  const last = UMALQURA_CUM_STARTS[UMALQURA_CUM_STARTS.length - 1] - 1
  if (!Number.isFinite(jdn) || jdn < first || jdn > last) return null

  // Binary search: find greatest cumStart <= jdn
  let lo = 0
  let hi = UMALQURA_CUM_STARTS.length - 1
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2)
    if (UMALQURA_CUM_STARTS[mid] <= jdn) lo = mid
    else hi = mid - 1
  }
  const monthsSinceEpoch = lo
  const year = UMALQURA_MIN_YEAR + Math.floor(monthsSinceEpoch / 12)
  const month = (monthsSinceEpoch % 12) + 1
  const day = jdn - UMALQURA_CUM_STARTS[monthsSinceEpoch] + 1
  return { year, month, day }
}

export function umalquraYearLength(year: number): number {
  let total = 0
  for (let m = 1; m <= 12; m++) total += umalquraMonthLength(year, m)
  return total
}
