/**
 * Search normalisation for the text picker.
 *
 * The picker is the primary surface, so search has to work the way people
 * actually type. Two failures made the old filter useless for Arabic:
 *
 * 1. **No diacritic folding.** The corpus is vocalised (tashkeel), so someone
 *    searching `الاستغفار` got nothing for `ٱلسَّتِغْفَار`. Nobody types tashkeel
 *    to search, and the corpus is full of it.
 * 2. **Orthographic variants ununified.** `أ إ آ ٱ ا` are the same letter, as
 *    are `ى ي` and `ة ه`. Uthmani text in particular uses `ٱ` at word start.
 *
 * The old filter also matched only `arabic`, `titleEn` and `titleAr`, while the
 * row displayed `source` and `hisnRef` — so a user who could see "Bukhari 6306"
 * on screen could not search for it.
 *
 * All pure, so the behaviour is testable in CI rather than only by eye.
 */

/** Arabic combining marks: tashkeel, sukun/shadda, superscript alef, Quranic marks. */
const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g

/**
 * Superscript alef, dagger alef and the small high marks that Uthmani text uses
 * for hamza carriers. Folding them is what makes `ٱلرَّحْمَٰن` match
 * `الرحمن` typed without any of it.
 */
const SMALL_MARKS = /[ٕٖٓ-ٕ]/g

/** Tatweel (kashida) is a typographic stretch, never a search distinction. */
const TATWEEL = /ـ/g

/**
 * Fold Arabic orthographic variants so a query matches regardless of how the
 * corpus spells a letter. Order matters: superscript alef is folded into a
 * plain alef before the alef family is unified.
 */
const LETTER_FOLD: Record<string, string> = {
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ٱ': 'ا',
  'ٲ': 'ا',
  'ٳ': 'ا',
  'ى': 'ي',
  'ئ': 'ي',
  'ؤ': 'و',
  'ة': 'ه',
  'ک': 'ك',
  'ی': 'ي',
  'ے': 'ي',
  'ھ': 'ه',
}

/**
 * Collapse a string to a comparison form: lowercased, unvocalised, orthographic
 * variants unified, tatweel removed, whitespace collapsed.
 *
 * Sacred text is never modified by this — it is only ever used to decide which
 * rows to show. The Arabic sent to the canvas is the corpus string, untouched.
 */
export function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(DIACRITICS, '')
    .replace(SMALL_MARKS, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱٲٳ]/g, (c) => LETTER_FOLD[c])
    .replace(/[ىئےی]/g, (c) => LETTER_FOLD[c] ?? 'ي')
    .replace(/[ؤ]/g, LETTER_FOLD['ؤ'])
    .replace(/[ةھ]/g, (c) => LETTER_FOLD[c])
    .replace(/[ک]/g, LETTER_FOLD['ک'])
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Every whitespace-separated term must appear in at least one of `haystacks`.
 * AND-ing the terms is what makes "sayed bukhari" find a single row instead of
 * everything that matches either word.
 */
export function matches(query: string, haystacks: readonly string[]): boolean {
  const terms = normalise(query).split(' ').filter(Boolean)
  if (terms.length === 0) return true
  const pool = haystacks.map(normalise)
  return terms.every((term) => pool.some((text) => text.includes(term)))
}

/**
 * A tiny accent-insensitive Latin fold, so `Kaddu` finds `Kaddū`.
 *
 * Curated quotes carry transliterated author and work names written with
 * macrons and typographic apostrophes ("Imam al-Shafi\u2018i"). Folding both
 * means a plain keyboard query still finds them.
 */
export function normaliseLatin(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u02b9\u02bc\u2018\u2019]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Combined matcher: Arabic folding plus Latin accent folding. */
export function matchesText(query: string, haystacks: readonly string[]): boolean {
  const terms = query
    .split(/\s+/)
    .map((term) => normalise(term))
    .filter(Boolean)
  if (terms.length === 0) return true
  const arabicPool = haystacks.map(normalise)
  const latinPool = haystacks.map(normaliseLatin)
  return terms.every(
    (term) =>
      arabicPool.some((text) => text.includes(term)) ||
      latinPool.some((text) => text.includes(term)),
  )
}
