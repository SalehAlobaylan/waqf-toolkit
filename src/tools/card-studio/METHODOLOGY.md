# Card Studio — Methodology & Disclosure

> Status: **experimental**. The tool ships and is usable end-to-end, but the
> Arabic corpus and quote citations require domain review before the catalog
> status may change to `available` (see §6). This document names every source,
> license, and derivation so a reviewer can verify the claims independently.

## 1. What this tool does

Card Studio composes up to three Arabic text blocks — an ayah (Quran), a dua
(Hisn al-Muslim starter set), or a scholar quote (curated candidate or
user-provided) — into one image or text card. Every block carries its citation
inside the card image so forwarding cannot strip provenance. Arabic only:
v1 ships no translations.

Processing is `browser`: all datasets are bundled with the site, all rendering
uses `<canvas>` on the user's device, and nothing is uploaded. A draft is kept
in `localStorage` only behind an explicit opt-in ("Save draft on this device")
and can be cleared at any time. There are no server functions, no third-party
APIs, no analytics, and no accounts.

## 2. Datasets

| Dataset | Source | Version / retrieval | License | Integrity |
| :--- | :--- | :--- | :--- | :--- |
| Quran — Uthmani | [Tanzil Quran Text](https://tanzil.net) (`quranType=uthmani`, `outType=txt-2`) | Retrieved **2026-09-13**; source MD5 `7410caf5dc5b337de917b47ed887e3cb` | Tanzil text notice, stored verbatim at `src/tools/card-studio/data/quran/LICENSE.txt` | Derived dataset checksum `fnv1a-49059574`, pinned in `index.ts` and asserted in `data.test.ts` |
| Quran — metadata | [Tanzil quran-data.xml](https://tanzil.net/res/text/metadata/quran-data.xml) | Retrieved 2026-09-13 (`version="1.0"`) | `license="cc-by"` (Tanzil metadata) | Surah names, transliterations, and ayah counts are parsed, not typed |
| Dua — starter set | Hisn al-Muslim, chapter 27 (morning & evening), carried over from the in-repo Adhkar Companion curation | `1.0.0` | Compilation text; citations as facts | FNV-1a checksum pinned in `data.test.ts`; **citations are candidates** |
| Scholar quotes — curated | Public-domain classical works (Ibn al-Qayyim, al-Shafi‘i) | `0.1.0` | Public domain | Every entry ships `verified: false`; wording + location pending review |
| Scholar quotes — user-provided | Typed by the user on their device | — | User's own entry | Never uploaded; exported marked “unverified”; author + book + page/section mandatory |

### 2.1 Quran derivation (exactly what “verbatim” means)

Tanzil stores the basmala as a prefix of the first ayah of most suras. The
generator (`scripts/build-quran-data.mjs`) splits that prefix into a
`basmala` field so the card can show it above the ayah as a mushaf does.
Concatenating `basmala + " " + ayat[0]` reproduces the source line
character-for-character; the generator refuses to write output otherwise, and
the pinned checksum covers the reconstructed text. Surah 1 keeps the basmala
as its first ayah, and surah 9 has none. No other transformation is applied —
no normalization, no diacritic changes, no reordering.

Regenerate with:

```sh
node scripts/build-quran-data.mjs --download
# or, against an already downloaded pair:
node scripts/build-quran-data.mjs --source <dir with quran-uthmani.txt + quran-data.xml>
```

A source update changes both hashes; update this table, `index.ts`, and the
pinned test value in the same commit.

### 2.2 Quranic text has exactly one source

Quran blocks always render from the Tanzil dataset. The Dua dataset
deliberately excludes the Quranic items that appear in the Adhkar Companion
(Ayat al-Kursi, al-Ikhlas, al-Falaq, an-Nas) so sacred text never enters a
card through a second, unverified transcription.

## 3. Fonts

| Font | Use | License |
| :--- | :--- | :--- |
| Amiri | All card Arabic, including Uthmani | SIL Open Font License 1.1 — `public/fonts/LICENSE-amiri.txt` |
| Thmanyah Sans / Display | Arabic UI labels and citations | Free for personal and commercial use — `public/fonts/LICENSE-thmanyah.txt` |
| DM Sans / Space Mono | Latin card labels and footer | OFL (as shipped by the site) |

Amiri is self-hosted and loaded lazily by the renderer (`render.ts` calls
`document.fonts.load` before drawing). The same font stack is used for
measuring and drawing, so layout and output can never disagree.

## 4. Rendering & export integrity (V2)

- **Script-aware typesetting.** `engine/linebreak.ts` wraps between **grapheme
  clusters** (`Intl.Segmenter`) and reports every word as a measured box.
  V1 hard-split overlong words by character, which could detach tashkeel from
  its base letter or cut a lam-alif ligature; that defect is fixed and covered
  by a test.
- **Measured, not guessed.** Layout is measured in a hidden DOM mirror using
  the same font stacks the canvas draws with (`engine/measure.ts`), so line
  breaking matches the browser's own shaper. The pure engine takes an injected
  `Measurer`, which is why the whole thing stays unit-testable.
- **Justification never touches a letter.** Arabic lines are justified by
  distributing the measured slack **between words**. Kashida/tatweel is never
  inserted: it would mutate sacred text.
- **Never clipped.** The pure layout wraps full text and shrinks type until
  everything fits above the footer. When it does not fit, rendering throws
  `layout-overflow` and the UI refuses to export. No block is ever sliced —
  the shrink loop is allowed to go down to the template's own floor, so even
  the longest ayah (2:282, 1,173 characters) renders alone in a square card.
- **Legibility is reported, not assumed.** Each template declares a minimum
  Arabic size per frame; a card that only fits at that floor is flagged in the
  UI so a calmer template can be chosen.
- **Provenance travels with the file.** Exports embed `Description` and
  `Software` iTXt chunks (`render/png-meta.ts`), and the optional verify QR
  encodes the deep link that rebuilds the exact design.
- **Source inside the image.** Each block's citation line is drawn in the
  export. Cards containing Quran text carry “Not a mushaf.” in the footer.
- **No normalization.** Quran and dua strings are never spell-checked,
  normalized, or passed through a translator. Manual quote text is written by
  the user and never transformed; it is exported with an explicit “unverified”
  marker.
- **One language at a time.** Labels, citations, and the footer render entirely
  in the active locale. Sacred Arabic text is always present as content.
- **Deterministic palettes.** Card colors are pinned hex values in `types.ts`,
  independent of the live site theme, so exports are stable.

## 5. Governance: the dataset registry

Every bundled text dataset is registered in `src/data/datasets.ts` through
`src/tools/card-studio/data/records.ts`, and `src/data/datasets.test.ts` fails
CI if an entry is incomplete. A record must carry `source`, `version`,
`license`, `checksum`, `reviewState`, and — for generated datasets — the
`sourceChecksum` of the upstream file. `verified` additionally requires a named
reviewer and a date.

Review states are honest by construction:

| State | Meaning | Ships? |
| :--- | :--- | :--- |
| `verified` | A named reviewer checked wording and citation | yes |
| `in-review` | Under review now | yes, labelled |
| `candidate` | Not yet checked; the card says so | yes, labelled `under review` |

Current state: Quran `verified` (source checksum + reconstruction test), Dua
`candidate` (citations pending), curated quotes `candidate` (wording and page
pending). The tool ships as `experimental` and the UI shows each dataset's
state on the card.

## 6. Templates and the design system

Templates are **data, not code** (`engine/templates.ts`): 20 presets across
parchment, night, minimal, and calligraphic families, each declaring its
palette, background, ornament set, typography pairing, layout variant, and
per-frame size floors. Palettes are pinned hex values in `render/palette.ts`
and are contrast-checked (WCAG ratios) so no shipped palette can render
citations below 4.5:1.

All artwork is procedural — stars, arches, rosettes, borders, and the
`paper`/`glow`/`lattice`/`girih`/`arches` backgrounds are drawn as paths, so
the design system adds no image assets and needs no moderation. Template
thumbnails in the picker are rendered by the **real engine** at 270 px, so a
preview can never disagree with the export.

## 7. Combining rules

- Blocks are laid out **sequentially** (`classic` or `feature` variants) — no
  free drag, no overlap, and therefore no possibility of placing Quran text
  under another layer.
- Maximum three blocks per card; the same block cannot be added twice.
- Quran blocks always render their own label and citation; the basmala is only
  shown when the selection starts at ayah 1 of a sura other than 1 and 9.

## 8. Review checklist (gate to `available`)

- [ ] Dua starter set: every Arabic string verified character-for-character
      against Hisn al-Muslim, and every `source` (collection + number) checked.
- [ ] Curated quotes: wording verified against a printed edition; author,
      work, and page/section filled in; `verified` flipped to `true` per entry
      only after verification.
- [ ] Quran typography reviewed on Chrome, Safari/macOS, and iOS: shaping,
      diacritic placement, line height, and the basmala treatment.
- [ ] A card containing one ayah, one dua, and one quote reviewed in both
      locales and all three frames at full resolution.
- [ ] Exported JSON spot-checked for provenance (dataset tags, surah:ayah,
      hisnRef, quote author/book/page, `unverified` flags).
- [ ] Typography reviewed in **Safari/iOS** as well as Chromium: shaping,
      justification, and the verify QR scanning from a phone camera.
- [ ] The full-Quran sweep (6,236 ayat) re-run after any engine change.
- [ ] Two named reviewers recorded in the registry roster before more chapters
      are accepted.
- [ ] Domain-knowledgeable reviewer sign-off recorded here with a date.

Signed off by: — (not yet)

## 9. Known limits

- The Dua starter set is intentionally small (14 items, Hisn ch. 27); it grows
  only through reviewed additions.
- Translation is out of scope for v1 (licensing + attribution separate from
  the Arabic text).
- User-uploaded backgrounds, freeform layout, and cloud lookup are explicitly
  out of scope; adding uploads later requires a moderation review before any
  such feature ships.
