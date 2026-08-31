export type AsrJuristic = 'standard' | 'hanafi'
export type HighLatRule = 'none' | 'middle-of-night' | 'one-seventh' | 'angle-based'
export type PolarBehavior = 'unresolved' | 'angle-based'

export type PrayerMethod = {
  id: string
  name: string
  nameAr: string
  /** Fajr depression angle below horizon (degrees, positive) */
  fajrAngle: number
  /** Isha depression angle; if null, Isha is fixed minutes after Maghrib */
  ishaAngle: number | null
  /** Fixed minutes after Maghrib when ishaAngle is null (e.g. Umm al-Qura 90) */
  ishaIntervalMinutes?: number
  source: string
  version: string
}

/**
 * Reviewed, versioned presets. Each must cite an institutional publication;
 * a library name alone is not sufficient. These constants should be checked
 * against current publications before marking the tool `available`.
 *
 * Table cross-checked with PrayTimes method table and adhan-js parameter model;
 * values here are intentionally explicit rather than imported.
 */
export const PRAYER_METHODS: PrayerMethod[] = [
  {
    id: 'muslim-world-league',
    name: 'Muslim World League',
    nameAr: 'رابطة العالم الإسلامي',
    fajrAngle: 18,
    ishaAngle: 17,
    source: 'Muslim World League (18° / 17°)',
    version: '1.0.0',
  },
  {
    id: 'egyptian',
    name: 'Egyptian General Authority of Survey',
    nameAr: 'الهيئة المصرية العامة للمساحة',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    source: 'Egyptian General Authority of Survey (19.5° / 17.5°)',
    version: '1.0.0',
  },
  {
    id: 'umm-al-qura',
    name: 'Umm al-Qura (Saudi Arabia)',
    nameAr: 'أم القرى',
    fajrAngle: 18.5,
    // Umm al-Qura defines Isha as fixed interval after Maghrib (90 min, 120 in Ramadan historically).
    // We use 90 as the general case and document the limitation.
    ishaAngle: null,
    ishaIntervalMinutes: 90,
    source: 'Umm al-Qura University, Makkah (18.5° / 90 min)',
    version: '1.0.0',
  },
  {
    id: 'kuwait',
    name: 'Kuwait',
    nameAr: 'الكويت',
    fajrAngle: 18,
    ishaAngle: 17.5,
    source: 'Kuwait (18° / 17.5°)',
    version: '1.0.0',
  },
  {
    id: 'qatar',
    name: 'Qatar',
    nameAr: 'قطر',
    fajrAngle: 18,
    ishaAngle: null,
    ishaIntervalMinutes: 90,
    source: 'Qatar (18° / 90 min)',
    version: '1.0.0',
  },
]

export function getMethod(id: string): PrayerMethod | undefined {
  return PRAYER_METHODS.find((m) => m.id === id)
}

export const DEFAULT_METHOD_ID = 'muslim-world-league'
export const DEFAULT_ASR: AsrJuristic = 'standard'
export const DEFAULT_HIGH_LAT: HighLatRule = 'middle-of-night'
