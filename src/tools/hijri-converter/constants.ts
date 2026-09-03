/**
 * Hijri converter constants — versioned, single source of truth.
 *
 * Epochs are Julian Day Numbers at noon UTC (integer JDN).
 * - CIVIL_EPOCH_JD = 1948439 corresponds to 1 Muharram 1 AH (tabular civil, Thursday epoch)
 *   — Gregorian 622-07-18 (proleptic). Maps to 1948439.5 at midnight.
 *   Variant label: `islamic-civil` (CLDR `ca-islamic-civil`).
 * - UMALQURA_EPOCH_JD = first month start (1356-01-01) => 2428607 = 1937-03-14 Gregorian.
 *   Bundled table covers 1356 AH .. 1500 AH inclusive (1740 months).
 */

export const CIVIL_EPOCH_JD = 1948439 as const
export const CIVIL_VARIANT = 'islamic-civil' as const
export const UMALQURA_VARIANT = 'islamic-umalqura' as const

export type HijriVariant = typeof CIVIL_VARIANT | typeof UMALQURA_VARIANT

export const UMALQURA_EPOCH_JD = 2428607 as const
export const UMALQURA_MIN_YEAR = 1356 as const
export const UMALQURA_MAX_YEAR = 1500 as const
export const UMALQURA_MIN_JD = UMALQURA_EPOCH_JD
export const UMALQURA_MAX_JD = 2479989 // last valid day 1500-12-30 (see umalqura-data.ts: UMALQURA_LAST_JDN)

export const VERSION_CIVIL = 'tabular-30y-v1.0.0' as const
export const VERSION_UMALQURA = 'umalqura-saudi-1356-1500-v1.0.0' as const

export const HIJRI_MONTH_NAMES_EN = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
] as const

export const HIJRI_MONTH_NAMES_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const

export const SUPPORTED_VARIANTS: readonly HijriVariant[] = [UMALQURA_VARIANT, CIVIL_VARIANT] as const
