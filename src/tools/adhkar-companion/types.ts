/** Adhkar Companion — curated morning/evening remembrances. */

export type DhikrSet = 'morning' | 'evening'

export type Dhikr = {
  /** Stable kebab-case id, used in storage + export. */
  id: string
  /** Which sets include this dhikr. Both = recited morning and evening. */
  sets: DhikrSet[]
  /** Short English label (UI only, not a translation). */
  titleEn: string
  /** Short Arabic label (UI only). */
  titleAr: string
  /** Immutable Arabic text — never normalized, spell-checked, or translated by code. */
  arabic: string
  /** Plain-language English hint — NOT a scholarly translation. Verified wording lives with the reviewer. */
  meaningEn: string
  /** Plain-language Arabic hint — NOT a scholarly translation. */
  meaningAr: string
  /** Prescribed repetitions. */
  target: number
  /** Hadith/Quran reference, e.g. 'Bukhari 6306'. Candidate until domain review signs off. */
  source: string
  /** Hisn al-Muslim chapter pointer, e.g. 'Hisn ch. 27'. */
  hisnRef: string
}

/** User-added remembrance. Stored locally only, flagged as custom in export. */
export type CustomDhikr = {
  id: string
  sets: DhikrSet[]
  titleEn: string
  titleAr: string
  arabic: string
  meaningEn: string
  meaningAr: string
  target: number
  source: string
  hisnRef: string
  custom: true
}

export type AnyDhikr = Dhikr | CustomDhikr

export function isCustomDhikr(item: AnyDhikr): item is CustomDhikr {
  return (item as CustomDhikr).custom === true
}

export type DhikrFilter = 'morning' | 'evening' | 'all' | 'custom'

export type Counts = Record<string, number>
