/**
 * Curated scholar quotes, v0.1 — candidates only.
 *
 * Every entry starts `verified: false`. Wording and exact work/page
 * references must be checked character-for-character by a domain reviewer
 * before this tool leaves `experimental` (METHODOLOGY.md §6). Until then the
 * picker and every export label these as under review.
 *
 * Rules for adding entries:
 * - Public-domain classical texts only (or explicit permission).
 * - `author`, `work`, and `locator` are mandatory in review, even when a
 *   candidate entry ships with an empty locator.
 * - Never quarantine a quote behind "a scholar said" — attribution or nothing.
 */

export type CuratedQuote = {
  id: string
  authorAr: string
  authorEn: string
  workAr: string
  workEn: string
  locatorAr: string
  locatorEn: string
  arabic: string
  verified: boolean
}

export const QUOTE_DATASET_VERSION = '0.1.0'

export const CURATED_QUOTES: CuratedQuote[] = [
  {
    id: 'ibn-qayyim-heart-bird',
    authorAr: 'ابن القيم',
    authorEn: 'Ibn al-Qayyim',
    workAr: 'مدارج السالكين',
    workEn: 'Madarij al-Salikin',
    locatorAr: '',
    locatorEn: '',
    arabic: 'القلب في سيره إلى الله كالطائر: المحبة رأسه، والخوف والرجاء جناحاه.',
    verified: false,
  },
  {
    id: 'shafii-kaddu',
    authorAr: 'الإمام الشافعي',
    authorEn: 'Imam al-Shafi‘i',
    workAr: 'ديوان الشافعي',
    workEn: 'Diwan al-Shafi‘i',
    locatorAr: '',
    locatorEn: '',
    arabic: 'بقدر الكدّ تُكتسب المعالي، ومن طلب العلا سهر الليالي.',
    verified: false,
  },
]

/** FNV-1a over the curated strings + attribution; CI pins the value. */
export function quoteChecksum(): string {
  let hash = 0x811c9dc5
  const body = CURATED_QUOTES.map(
    (q) => `${q.id}:${q.authorEn}:${q.workEn}:${q.arabic}`,
  ).join('\n')
  for (let i = 0; i < body.length; i++) {
    hash ^= body.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}
