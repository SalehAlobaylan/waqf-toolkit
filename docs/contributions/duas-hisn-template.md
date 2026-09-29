# Contribution template — Dua (Hisn al-Muslim)

Copy this file, rename it `<chapter>.md`, and fill one section per du'a. A
reviewer verifies each entry against the named printed source; when they sign
off, the entries move into `src/tools/card-studio/data/duas.ts` and the
checksum in the dataset test is updated in the same pull request.

**Rules that CI and the reviewer both enforce**

1. **Arabic is immutable.** Copy it character-for-character from the named
   edition, including tashkeel. No normalisation, no re-typing, no "fixing".
2. **Quran never comes from here.** If the du'a quotes an ayah, cite
   `ayah:<surah>:<first>[-<last>]` instead — sacred text has exactly one
   source of record (the Tanzil dataset).
3. **Every entry cites its source** — collection and number, exactly as printed
   (`Bukhari 6306`, `Abu Dawud 5081`). "Some book" is not a citation.
4. **Titles are UI labels**, not translations. Keep them short and factual.
5. **No AI-generated text**, no scraping, no modern copyrighted books without
   permission.
6. **Keep it small.** 10–15 entries per pull request is reviewable. A 200-entry
   dump is not.

**Definition of done for the pull request**

- [ ] Every entry has `id`, `titleEn`, `titleAr`, `arabic`, `source`
- [ ] `id` is kebab-case and unique
- [ ] `arabic` copied from the printed source, not from a website
- [ ] `pnpm test` green (schema + checksum updated)
- [ ] Reviewer name and date recorded in the registry entry
  (`src/tools/card-studio/data/records.ts`)

---

## Chapter: <!-- e.g. Hisn al-Muslim, chapter 57 -->

Edition consulted: <!-- e.g. Hisn al-Muslim, Sa'd edition, 1419 AH, p. 233 -->
Reviewer: <!-- name -->
Reviewed on: <!-- YYYY-MM-DD -->

```ts
{
  id: 'example-dua-id',            // kebab-case, unique in the file
  titleEn: 'Short English label',  // UI label, not a translation
  titleAr: 'عنوان قصير',
  arabic: 'النص العربي كما ورد في المطبوع',
  source: 'Bukhari 6306',
  hisnRef: 'Hisn ch. 57',
}
```

<!-- Repeat the block per du'a. Ten to fifteen per pull request. -->

---

## Notes for the reviewer

- Character-for-character comparison against the printed page, not memory.
- Confirm the collection + number, and that the wording matches that collection.
- If the entry quotes Quran, replace it with an `ayah:` reference.
- If a du'a appears in several chapters, add it once and note the others in the
  review note.
