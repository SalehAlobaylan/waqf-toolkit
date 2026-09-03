import { HIJRI_MONTH_NAMES_AR, HIJRI_MONTH_NAMES_EN } from './constants'

const ARAB_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const

function toArabicDigits(s: string): string {
  return s.replace(/\d/g, (d) => ARAB_DIGITS[Number(d)])
}

export function formatNumber(n: number, numbering: 'latn' | 'arab', locale: 'en' | 'ar'): string {
  const str = String(n)
  if (numbering === 'arab') return toArabicDigits(str)
  // Even for Arabic locale, allow latn
  void locale
  return str
}

export function formatHijriDate(
  hijri: { year: number; month: number; day: number },
  opts: { locale: 'en' | 'ar'; numbering: 'latn' | 'arab'; monthStyle?: 'numeric' | 'long' },
): string {
  const { locale, numbering, monthStyle = 'long' } = opts
  const dayStr = formatNumber(hijri.day, numbering, locale)
  const yearStr = formatNumber(hijri.year, numbering, locale)
  if (monthStyle === 'numeric') {
    const monthStr = formatNumber(hijri.month, numbering, locale)
    // Pad day/month to 2 digits for numeric
    const pad = (s: string) => (s.length === 1 && numbering === 'latn' ? `0${s}` : s.length === 1 && numbering === 'arab' ? `٠${s}` : s)
    // For arab, toArabicDigits already, but pad with arab zero
    return `${pad(dayStr)}-${pad(monthStr)}-${yearStr}`
  }
  const monthNames = locale === 'ar' ? HIJRI_MONTH_NAMES_AR : HIJRI_MONTH_NAMES_EN
  const monthName = monthNames[hijri.month - 1] ?? String(hijri.month)
  const suffix = locale === 'ar' ? 'هـ' : 'AH'
  return `${dayStr} ${monthName} ${yearStr} ${suffix}`
}

export function formatGregorianDateISO(g: { year: number; month: number; day: number }): string {
  return `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`
}

export function tryFormatWithIntl(
  hijri: { year: number; month: number; day: number },
  jdn: number,
  variant: 'islamic-umalqura' | 'islamic-civil',
  locale: 'en' | 'ar',
  timeZone: string,
): string | null {
  // Intl formatting is optional, fallback to manual if unavailable
  try {
    const can = (() => {
      try {
        return Intl.supportedValuesOf('calendar').includes(variant)
      } catch {
        return false
      }
    })()
    if (!can) return null
    // Need a Date object for the Gregorian day at noon UTC — use JDN -> Gregorian -> Date
    // Construct Date at 12:00 UTC to avoid DST shift
    // Use jdnToGregorian inverse to get y/m/d, then create Date
    // For simplicity, use the hijri's gregorian counterpart if available; here we recompute
    // We'll create a Date from the Gregorian y/m/d
    // This requires converting JDN back to Gregorian; we already have hijri's gregorian in caller usually.
    // As fallback, use manual formatting:
    return null
  } catch {
    return null
  }
  void jdn
  void timeZone
}
