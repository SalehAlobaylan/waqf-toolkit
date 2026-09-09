# Methodology — Adhkar Companion (Morning & Evening)

> Per `CONTRIBUTING.md`, religious content requires domain-knowledgeable review
> in addition to code review. This document must be complete before the PR is
> merged, and a reviewer must sign off on the tracking issue before this tool
> leaves `experimental`.

---

## 1. What is calculated

No ruling is calculated. The tool tracks repetitions of a curated set of
morning/evening remembrances against prescribed counts (1, 3, 7, 10, 33, 34,
100). Outputs:

- per-dhikr count vs target (`count/target`, capped — tapping past the target stays at target)
- today's progress (`done/total`, counted/prescribed %, never a streak that shames)
- a printable checklist / booklet and a JSON record with full provenance

It is a **private counter and checklist**, not a fatwa and not a Hisn replacement.

## 2. Inputs and their sources

| Input | Source | Validation |
|---|---|---|
| Set filter (Morning / Evening / All / Custom) | User toggle, default Morning | Allowlist of 4 values; persisted as display pref |
| Taps / spacebar / undo | User, featured card only | `increment` caps at target, `decrement` floors at 0; non-finite → safe default |
| Search query | User text | Exact substring over Arabic/title; empty = all |
| Custom dhikr (Arabic + target + set) | User-typed | Arabic required non-empty; target integer 1–1000; max 50 items |
| Save on this device | Opt-in checkbox, default off | Gates `localStorage` for counts + custom items; prefs persist regardless (display only) |
| Digits (latn/arab), font size | User toggle | Display only; Arabic dhikr strings untouched |

No network fetch. No geolocation. No account.

## 3. Algorithm and conventions

- **Counting:** `increment = min(target, floor(count)+1)`, `decrement = max(0, floor(count)-1)`. Implemented pure in `engine.ts`; UI holds no math.
- **Day boundary:** counts reset at device civil midnight (`dayKeyFromMs` local `YYYY-MM-DD`). Stale stored days are discarded, never carried over. The UI states this; it is not a sunset ruling.
- **Morning vs evening:** v1 does NOT compute time windows. The user picks the set. Fajr→Dhuhr / Asr→Maghrib conventions are recognized differences and are explicitly out of scope for v1 (a later version may *suggest* a set using the reviewed prayer-times engine, never enforce).
- **Prescribed counts** (1/3/7/10/33/34/100) come from the cited source per item. Where narrations differ on a count, the tool shows one labelled count and names the source — it does not average or merge.
- **Custom items** are user content, flagged `custom: true` in state and export, excluded from Morning/Evening/All filters (they live under Custom).

**If two authorities could disagree, it is here:** set windows, count variants, source grading, translation wording. All are shown per item or marked out of scope — never hidden defaults.

## 4. Data sources

| Dataset | Origin | Version/date | License | Why trusted |
|---|---|---|---|---|
| Curated Arabic texts (18 items) | Quran (2:255; ch. 112–114) + prophetic remembrances as cited in Hisn al-Muslim ch. 27 | `DATASET_VERSION 1.0.0` | Short devotional excerpts with attribution; full licensing review pending — tool stays `experimental` until cleared | Candidate baseline; Arabic stored verbatim + checksummed (`datasetChecksum`, FNV-1a) with CI regression test |
| Per-item `source` numbers (e.g. Bukhari 6306) | Hisn al-Muslim's citations | `1.0.0` | Citations as facts | Candidates — reviewer verifies each number before `available` |
| English/Arabic `meaning*` hints | Waqf plain-language UI hints | `1.0.0` | Own words | Explicitly NOT scholarly translations; Arabic is authoritative; export carries this warning |

- Arabic strings are never normalized, spell-checked (`spellCheck={false} translate="no"`), auto-translated, or clipped invisibly. Export is blocked rather than clipping an ayah.
- Translation license rule (Arabic license ≠ translation license) is respected by keeping hints separate, unattributed to any publisher, and labelled as hints.

## 5. Known limitations

- 18 of ~130 Hisn chapters. Missing items are out of scope, not errors — the Custom tab covers personal additions locally.
- `meaning*` hints are not translations for study or citation. Verify wording with a qualified teacher.
- Counts measure taps, not acceptance or presence of heart. The tool says this in plain words.
- Midnight reset is civil convenience, not a fiqh boundary for morning/evening.
- No audio, no notifications, no background alarms, no cloud backup. Device loss = progress loss unless the user exported JSON.
- **Image export** (`card-image.ts` layout + canvas renderer, PNG/JPEG/WebP download) exports one duaa at a time in a single language — set name, title, and Arabic text only. It deliberately carries no source line or warning: provenance travels with Copy card and the JSON export instead. It runs fully in the browser with the page's own bundled fonts — no upload, no server. Layout math is unit-tested (`card-image.test.ts`): the Arabic block is never sliced (export is refused rather than cutting a verse). Format falls back to PNG where the browser lacks an encoder. If rendering fails, the tool falls back to Copy card. Progress summaries are deliberately not images — JSON export and the print booklet cover those.

## 5b. Print booklet

- The booklet prints the *current set* through a pure `printModel()` (unit-tested parity: every visible item, in order, plus cover/layout passthrough). Options: Booklet (spacious cards with hand-tick boxes) vs Checklist (compact two-column), cover Forest band vs Light, meanings/sources toggles (default on), A4 (solid) vs A5 (best-effort — `@page` named-page support varies).
- The booklet is portalled to `document.body` as `#adhkar-print-portal`. The Print button sets `body.printing-adhkar` (+ `paper-a5`), and a global `@media print` block in `app.css` hides every other top-level sibling with `display: none` — normal document flow, so multi-page sets paginate correctly, with no shell edits required. Classes are removed on `afterprint` plus a timed fallback.
- Print design uses the theme palette (forest band cover option, forest card borders, olive rules, clay accents) forced with `print-color-adjust: exact`, drawn CSS tick-boxes (identical on every printer), and the same bundled Thmanyah faces with RTL/lang attributes and 2.2 line-height for tashkeel. Cover carries set name, date, count, dataset version; closing line carries methodology version + verify-teacher note.

## 5c. One language at a time

- Every surface renders entirely in the active locale — screen, copy text, JSON export, share image, and print booklet. English mode shows only English (+ the sacred Arabic text); Arabic mode shows only Arabic.
- Always exempt, in both locales: the sacred Arabic duaa text itself, proper nouns and codes (`Bukhari 6306`, `Hisn ch. 27`, `v1.0.0`, filenames), and numerals (which follow the user's latn/arab digit preference).
- Never hardcode UI copy in the component: all strings live in `src/i18n/en.ts` + `src/i18n/ar.ts` with key parity enforced by `tsc`. Placeholders match the UI locale (the Arabic-text field shows an Arabic placeholder in ar mode, English in en mode).

## 6. Review checklist (for reviewers)

- [ ] Methodology document is complete and specific
- [ ] Implementation matches the documented counting/filtering (`engine.ts`)
- [ ] All 18 Arabic strings verified character-for-character against the named source
- [ ] All 18 `source` numbers verified (collection + number + count match)
- [ ] `meaning*` hints read naturally in both languages and are clearly labelled as hints
- [ ] Convention choices visible in UI (set toggle is manual; midnight reset stated; no hidden windows)
- [ ] Checksum test passes; any dataset edit updates version + checksum deliberately
- [ ] Domain-knowledgeable reviewer has signed off

## 7. Reference values used in tests

| Input | Expected output | Source of truth |
|---|---|---|
| `increment(0, 3)` → `1`; `increment(3, 3)` → `3` (capped) | Cap invariant | `engine.test.ts` |
| `decrement(0)` → `0`; `decrement(2)` → `1` | Floor invariant | `engine.test.ts` |
| `todayProgress` over morning set, all zero | `done 0/16`-ish, `percent 0` | `engine.test.ts` (computed from dataset, not hardcoded) |
| `nextIncomplete` with all done → `null` | Stop, no wrap to done item | `engine.test.ts` |
| `datasetChecksum()` stable across calls + matches pinned constant | Tamper-evident dataset | `data.test.ts` |
| Sayyid al-Istighfar fixture: id/target/source + opening words | Exact-match spot check | `data.test.ts` (Bukhari 6306 text family) |
