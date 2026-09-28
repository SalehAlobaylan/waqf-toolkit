# Card Studio V2 — Deep Analysis & Execution Plan

> **Status:** analysis, not an implementation commitment. V2 still obeys every
> hard rule in `AGENTS.md` and the gate in
> `src/tools/card-studio/METHODOLOGY.md` (§6) — domain review before
> `available`.
> Written 2026-09-13, right after V1 (experimental) shipped.
> V1 reference implementation: `src/tools/card-studio/`.
> Tracking: issue **#19** (V2), **#16** (V1).

---

## 0. TL;DR — the thesis

**"Advanced" for a card editor of sacred text is not more knobs. It is three
things: typesetting quality, safe creativity, and provenance you can audit.**

V1 proved the mechanic (compose → lay out → export, browser-only, no clipping).
What it does *not* do is typeset like a professional, design with a system, or
survive scrutiny. V2 should spend its budget on exactly those three, and refuse
everything that drifts toward a Canva clone.

| Pillar | What it means | Why it is the real moat |
| :--- | :--- | :--- |
| **A. Typesetting** | Script-aware line breaking, justified Arabic, per-block optical scale, mixed-direction blocks, minimum-legibility rules | A card is judged in the first second. A mushaf-style card that wraps a diacritic to the next line is worse than a plain one. |
| **B. Safe creativity** | Templates as data, procedural ornaments + geometric backgrounds (no uploads), contrast enforcement, occasion collections | Beauty without moderation risk, licensing risk, or a QA matrix. |
| **C. Auditable provenance** | A dataset *registry* that every dataset must register with, a corrections channel, reviewer workflow, embeddable provenance in exports, deep links | The project's differentiator. Also the thing that makes future community contributions safe. |

**Sequencing that actually works:** four spikes (72 hours each) → foundation
(S1–S2) → the visible feature wave (S3–S7) → contribution intake (S8). Nothing
else gets built.

**The one sentence for reviewers:** *V2 is not "more templates" — it is a
typesetting engine plus a content pipeline, wrapped in a design system that
cannot disrespect the text.*

---

## 1. Diagnosis — what V1 actually is (measured, not remembered)

| Metric | Value | Consequence for V2 |
| :--- | :--- | :--- |
| Aya length distribution (Tanzil) | p50 **91** chars · p90 **216** · p99 **416** · max **2:282 = 1173** | Most verses fit generously; the tail (203 ayat > 300 chars, 11 > 600) is the typography stress test. `2:282` is *the* regression fixture. |
| Mean ayah | **111** chars | A single-ayah card is a small text block → the design carries the card, not the text volume. |
| Engine shapers | One greedy wrapper (`lib/text-layout.ts`), measured with `ctx.measureText` | No grapheme safety, no justification, no bidi, no per-glyph positions. |
| Hard-split path | `wrapText` splits overlong words **by character** | **Real defect:** can cut a base letter from its tashkeel, or a lam-alif ligature. Invisible in tests, visible in output. |
| Layout freedom | 2 variants (`classic`, `feature`), 4 palettes, 3 frames | Variety comes from color only. No template identity, no ornaments, no per-block typography. |
| Content | 14 duas, 6,236 ayat, 2 quote candidates | Dua and quotes are the bottleneck, not Quran. |
| Workflow | Live preview, copy text/JSON, download, opt-in draft | No undo/redo, no project files, no batch, no deep links, no print, no sidecar metadata. |
| Governance | Checksums + METHODOLOGY + one issue | Manual and per-tool. Nothing *prevents* an unreviewed dataset from shipping. |

**Conclusion:** V1's engine is a prototype that happens to be correct and
tested. V2 should replace the *shaper and layout model*, keep the *integrity
model*, and add the *governance model* that V1 lacks.

---

## 2. The five hard problems (and why the obvious answers are wrong)

### 2.1 Arabic line breaking is Unicode work, not `split(' ')`

V1 wraps on whitespace. V2 needs: **UAX #14 line breaking** for Arabic
(Kashida is an opportunity, not a character), **grapheme clusters** for the
hard-split path (`Intl.Segmenter`, granularity `grapheme`), and **no kashida
insertion into sacred text** — ever. Justification must come from *distributing
space between words*, not from stretching letters. That keeps every exported
string byte-identical to the source while still looking typeset.

*Wrong answer:* insert U+0640 tatweel to justify. It mutates the text. It is
how a tool corrupts a verse and never notices. **Rejected by principle.**

### 2.2 Canvas cannot typeset; the DOM can. Choose deliberately.

| Path | What you get | What it costs |
| :--- | :--- | :--- |
| **Canvas (V1)** | Deterministic, fast, one code path for screen + export, works for pure Arabic | No justification, no OpenType features beyond `fontVariantCaps`/`letterSpacing`/`wordSpacing`, no bidi mixing, measurement is approximate at the glyph level |
| **DOM + snapshot** | Browser-grade shaping, bidi, `text-align: justify`, `font-feature-settings`, CSS ornaments | New dependency (~30 kB gz), Safari/filter quirks, DOM↔image fidelity risk, heavier, needs a second rendering path to verify |

**Recommendation:** keep canvas as the export renderer, and **stop pretending
canvas can do typesetting**: adopt a *measured* pipeline —
1. hidden DOM mirror with the exact same fonts/styles,
2. per-line, per-word range measurement (`Range.getClientRects`),
3. draw the measured words at measured positions on canvas.

One layout model, browser-grade shaping, no export dependency, and Arabic
justification becomes trivial (distribute the measured slack between words).
This is the single most valuable architectural change in V2 and it is
*removable* if it misbehaves (S1 spike, 3 days, kill criterion below).

### 2.3 Bundles are the growth risk

Budget: **+40 kB gz total**, hard. Every feature must pay rent in bytes.
Rules that keep it honest:
- procedural art instead of image assets (ornaments, patterns, backgrounds
  drawn as paths);
- **font budget 60 kB** — subset one body + one display face (arabic subset),
  load **per template on demand**, cache the FontFace in the document;
- Quran data stays per-surah chunks (already 114 chunks; never bundle a
  second corpus in the same route chunk);
- **budget check** (`scripts/check-bundle-budget.mjs`, run via `pnpm budget`)
  reading the build manifest, so "tools stay small" is a machine check rather
  than a promise. It runs locally today; wiring the step into
  `.github/workflows/ci.yml` is deferred to a follow-up PR (it needs a
  `workflow`-scoped push token).

### 2.4 Content is the real bottleneck, and it is a governance problem

Quran is done (checksummed, tested). Dua is 14 items. Quotes are 2 candidates.
Typo risk scales with corpus size and *cannot* be eliminated by code. So V2's
highest-leverage work is **process**, not UI:

- a **dataset registry** (`src/data/datasets.ts`) where every dataset declares
  `source / version / license / checksum / reviewState / correctionsUrl`, and
  **CI refuses** any dataset that is missing a field;
- a **reviewer workflow** that flips `reviewState` with a name, date, and
  checklist reference — auditable, not a promise in a comment;
- a **corrections channel** (issue template) and a documented regeneration
  path (the Quran generator already exists and is the model);
- **contribution intake** as a first-class flow: a per-chapter contribution
  doc (chapter id, 12 items, ~5 kB diff), CI validation, one reviewer.

Expected throughput is **10–20 verified items per contribution**, not 200
scraped ones. That is the point.

### 2.5 Translations and transliteration are the two biggest "useful" traps

- **Translation**: licensed or not. V1's Arabic-only stance was correct. V2
  should add translation as a **separately licensed dataset** (public-domain
  first), always attributed, always visually separated, never generated.
  This unlocks non-Arabic reach — and is the single most requested thing in
  comparable tools.
- **Transliteration**: mechanically derivable, no license problem if we
  generate it — but machine output must be **labeled as a machine reference**,
  never presented as scholarship. Auto-generate from the Quran, hand-check the
  dua seed, keep the label.

Both unlock *mixed-direction cards* (Arabic block + Latin block side by side),
which is a real typesetting feature, not a cosmetic one.

---

## 3. Scope — ranked options

Legend: **Value** (user benefit) · **Risk** (integrity/licensing/moderation) ·
**Feat** (engineering weeks) · **Bytes** (gz).

### 3.1 Ship in V2 core

| # | Feature | Value | Risk | Feat | Bytes | Verdict |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | **Grapheme-safe wrapping** (fixes the hard-split defect) | High | None | 0.3 w | ~0 | **Do first.** It is a bug, not a feature. |
| 2 | **DOM-measured layout + word-level justification** | Very high | Low (measurement only) | 1.5 w | ~3 kB | **The spine.** Justified Arabic without touching a character. |
| 3 | **Templates as data + runtime thumbnails** | High | Low | 1 w | ~4 kB | 20+ presets (palette + typography + ornaments + layout) with previews rendered from the real engine. |
| 4 | **Ornament + pattern kit (procedural)** | High | None | 1 w | ~4 kB | 8-point stars, arches, muqarnas-ish bands, girih tiles, borders, dividers — drawn as paths, zero assets, zero moderation. |
| 5 | **Contrast + legibility guard** | High | None | 0.5 w | ~1 kB | Compute WCAG ratio in linear space; refuse or warn below 4.5:1 for citations/footer, 7:1 for body Arabic; enforce a minimum Arabic size per frame. |
| 6 | **Dataset registry + CI governance** | Very high (risk) | None | 0.5 w | ~0 | Converts "honest status" from prose into a machine gate. Foundation for everything after. |
| 7 | **Undo/redo** | High | None | 0.5 w | ~2 kB | Non-negotiable for any editor; cheap with a state machine + history stack. |
| 8 | **Project file import/export (`.card.json`)** | High | Low | 0.5 w | ~2 kB | Reproducible, versioned designs. Payload keeps **references, not text** (see §5). |
| 9 | **Occasion collections** (Ramadan, Friday, tasbeeh, wudu, travel, grief) | High | Medium (curation) | 0.5 w + content | ~1 kB | Small curated sets; they are mostly *combinations* of verified blocks, so review cost stays low. |
| 10 | **Deep links + QR "verify at source"** | High | Low | 0.5 w | ~1 kB | `?b=ayah:2:255;dua:sayyid;tpl=...` opens the exact card. QR encodes the same. Server-free, auditable. |
| 11 | **Provenance embedded in the PNG** (iTXt) | Medium | None | 0.3 w | ~1 kB | Dataset, block refs, review state, tool version. Plus `.txt` sidecar; Instagram still drops PNG text, hence #10. |

### 3.2 V2.1 (after the core is stable)

| # | Feature | Value | Risk | Feat | Verdict |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 12 | **Translation block (public-domain, attributed)** | Very high | Medium (licensing) | 1 w + content | Ship as its own dataset with its own registry entry; visually separate; never AI. |
| 13 | **Batch / carousel export** (7-day series, ZIP) | High | Low | 0.5 w | Store-only ZIP writer, no dependency. |
| 14 | **Print sheet (A5/A4) + export 2000/2480 px** | Medium | Low | 0.5 w | Reuse the adhkar print pipeline; mosque-distributable. |
| 15 | **Auto-transliteration** | Medium | Low | 0.5 w | Must be labeled machine-generated. |
| 16 | **Surah page references** in citations (Juz/Page) | Medium | Low (data spike) | 0.3 w | Needs Tanzil page data; verify license before bundling. |
| 17 | **Font pairing system** (Amiri body + kufi/ruqaa display, OFL, per template) | High | Low (licensing, bytes) | 0.5 w | 60 kB budget, subset + lazy. This is where "beautiful" comes from. |
| 18 | **Worker rendering** (`OffscreenCanvas`) | Medium | None | 1 w | Only if profiling shows jank; progressive enhancement. |

### 3.3 Defer (design triggers, not vibes)

- **User-uploaded backgrounds** → only after a moderation model exists
  (client-side EXIF strip, size caps, review queue, admin tooling). The user
  already said admins audit later; the doc must name what that requires.
- **Full surah layouts** → V2.2; only long surahs (Ya-Sin, Al-Kahf, Ar-Rahman,
  Al-Mulk) are plausible, and only if a paginated *page* model exists, not a
  single card.
- **Community contribution portal** → after the §6 pipeline exists (registry +
  review), otherwise it is an unreviewed-content hole.
- **Advanced photo effects / filters** → out of scope forever.

### 3.4 Reject (with reasons)

| Idea | Why not |
| :-- | :-- |
| Tajweed color-coding | Opinionated scholarly layer over sacred text, requires a rule dataset, and turns a quote card into a fatwa. Out. |
| AI translation / "smart" layout / auto-correction | AGENTS.md forbids AI rewriting of sacred text; unverifiable output. Out. |
| Free drag / layers / undo-everything | Explicitly deferred by the user; breaks layout guarantees. |
| Embroidery / plaque / 3D mockups | Trend-chasing; destroys the restrained tone. |
| Rich editor with per-block kashida/tatweel | Mutates text. Out (see §2.1). |

---

## 4. Architecture — the V2 engine

### 4.1 Modules

```
src/tools/card-studio/
├── engine/                 # pure, no DOM — fully unit-tested
│   ├── blocks.ts           # block model, provenance, edits, undo/redo reducer
│   ├── resolve.ts          # dataset → ResolvedBlock (localized, cited)
│   ├── measure.ts          # Measure interface: DOM mirror | stub (tests)
│   ├── linebreak.ts        # UAX #14 + grapheme segmentation, word positions
│   ├── layout.ts           # template → geometry (extend v1)
│   ├── template.ts         # TEMPLATES registry + validation
│   └── export.ts           # text/JSON/project/deep-link payloads
├── render/
│   ├── canvas.ts           # draws measured layout (v1 + word positions)
│   ├── ornaments.ts        # procedural paths (stars, arches, bands, borders)
│   ├── patterns.ts         # girih/lattice/gradient backgrounds
│   ├── palette.ts          # OKLCH palette + contrast math
│   └── png-meta.ts         # iTXt provenance chunk writer (+ test)
├── data/                   # quran/, duas/, quotes/, translations/, index
├── data.test.ts  layout.test.ts  golden.test.ts  export.test.ts
└── METHODOLOGY.md
```

`src/data/datasets.ts` (new, tool-agnostic) holds the registry; every dataset
module declares itself, and a test fails CI for missing metadata.

### 4.2 The measured layout pipeline (spine)

```
resolve (pure) → template (data) → measure words (hidden DOM) →
line-break (UAX #14, grapheme-safe) → fit (shrink scale, never slice) →
draw (canvas at measured positions) → encode (PNG/WebP) + iTXt
```

Guarantees to lock in tests:
1. **No slicing**: the concatenation of a block's lines reproduces the source
   string exactly (V1 already asserts this — keep it, now including
   justification, which must not insert characters).
2. **No split graphemes**: no line ever begins with a combining mark.
3. **Legibility floor**: body Arabic never below the per-frame minimum.
4. **Contrast floor**: citations/footer ≥ 4.5:1 against the background.
5. **Determinism**: same inputs → byte-identical PNG (same fonts, no randomness).

### 4.3 Templates as data

A template is data, not code: `{ id, palette, fonts, ornamentSet, background,
layoutVariant, labelStyle, minArabicPx, minCitationPx }`. The picker renders
thumbnails **from the real layout engine at 270 px** — one source of truth, no
stale screenshots. 20 templates across 4 families (parchment naskh, night
mushaf, minimal editorial, kufi display) with 4 procedural backgrounds each.

### 4.4 Project files and deep links

```jsonc
// .card.json — references, not text (small, reviewable, auditable)
{
  "tool": "card-studio", "version": 2,
  "style": { "template": "night-mushaf-01", "frame": "story", "digits": "arab" },
  "blocks": [
    { "kind": "ayah", "surah": 2, "ayahStart": 255, "ayahEnd": 255 },
    { "kind": "dua", "id": "sayyid-istighfar" }
  ],
  "datasets": { "quran": "fnv1a-49059574", "duas": "1.1.0" },
  "custom": { "quote": { "arabic": "<user text>", "author": "…", "verified": false } }
}
```

If a dataset version no longer matches, the tool says so on open instead of
silently rendering against newer text. Deep link:
`/en/tools/card-studio/try?b=ayah:2:255;dua:sayyid-istighfar;tpl=night-mushaf-01&v=2`.
QR encodes the same string — a "verify at source" that works offline.

---

## 5. Contribution & review pipeline (the part that makes it a *toolkit*)

1. **Contribute a chapter.** `docs/contributions/duas-hisn-chNN.md` lists the
   chapter id, the 12 items with `id / arabic / source / titleEn / titleAr`,
   and the review checklist. Total content per PR: ~5 kB.
2. **CI validates**: schema, unique ids, no Quran text in the dua file, pinned
   checksum, source string format.
3. **Reviewer verifies** character-for-character against the named source,
   then updates `reviewState` with name + date in the registry.
4. **Ship**: checksum bump in the same PR; METHODOLOGY table updated.

Anti-abuse rules that are enforced, not hoped for: no scraping requests, no
"scholar said" without work+page, no AI-generated text, no copyrighted modern
books without permission.

---

## 6. Execution plan (8 stages, ~16 weeks, one maintainer)

Each stage is one focused PR (or two), independently reviewable, with its own
definition of done. **Stop-gates** are explicit: a spike that fails its kill
criterion is dropped in the same week, not carried.

| Stage | Weeks | Content | Done when |
| :-- | :-- | :-- | :-- |
| **S0 spikes** | 1 | (a) DOM measurement vs canvas fidelity on Chrome + Safari/iOS; (b) UAX #14 + `Intl.Segmenter` line breaking; (c) template thumbnail cost at 270 px; (d) registry + CI gate prototype | Each spike ≤ 3 days with a written verdict. **Kill (a)** if measured word positions drift > 1 px vs canvas — then V2 falls back to canvas-only justification (documented, no justification) and continues. |
| **S1 integrity fixes** | 1 | Grapheme-safe wrapping; contrast/legibility guard; CI budget check | The 6,236-ayat sweep (§8) passes; the hard-split defect is gone and proven by a test. |
| **S2 engine spine** | 2 | `engine/` modules, DOM mirror, word-level justification, template data model | 20 templates render from data; V1's `layout.test.ts` invariants still pass; determinism test green. |
| **S3 design system** | 2 | Ornament kit, pattern kit, template registry + thumbnails, occasion collections | 20 templates × 3 frames × 2 locales render; visual QA sheet produced; no asset bloat. |
| **S4 workflow** | 2 | Undo/redo, project files, deep links, QR, iTXt provenance | Open/save/share round-trip verified in a real browser; sidecar + metadata readable. |
| **S5 content pipeline** | 2 | Dataset registry live, review workflow, contributions template, 3–5 new reviewed chapters | 50+ verified duas; registry enforces metadata; two external contributors onboarded in a test. |
| **S6 batch & print** | 1.5 | Batch/carousel ZIP, A5/A4 print sheet, 2000/2480 px exports | 7-day series exported and printed in a real browser. |
| **S7 hardening** | 1.5 | Golden fixtures, a11y pass (keyboard, focus, reduced motion), Safari/iOS QA, perf profile | CI green; a11y checklist signed; p95 preview < 50 ms (worker only if needed). |
| **S8 *(optional)* translations** | 2 | Public-domain translation dataset (registry entry + attribution + visual separation + mixed-direction layout) | **Only** if a license is verified; ships as its own dataset with `reviewState`; never AI. |

**Definition of done for V2 (tool-level):** templates + engine + pipeline
ship, `METHODOLOGY.md` updated, registry enforced, all gates green — *then*
request domain review for `available`. The two curated quotes stay candidates
until then.

---

## 7. How we perform it effectively (process)

1. **Spike before build.** Four cheap, time-boxed spikes with written verdicts
   and kill criteria (S0). The DOM-measurement fidelity spike is the one that
   decides the architecture — do it first, on real devices.
2. **One concern per PR.** S1..S7 map to PRs; no bundling of "engine +
   templates + upload moderation".
3. **Tests before pixels.** Engine/layout/golden/export tests are cheap and
   catch regressions a screenshot cannot. (See §8.)
4. **CI as the constitution.** Budget check, registry check, checksum checks,
   golden fixtures. If a rule matters, encode it; if it is prose, it will drift.
5. **Byte discipline.** New feature = old feature removed, or +0 kB. The budget
   is the review conversation.
6. **Integrity discipline.** Every new text path gets: verbatim guarantee,
   attribution, "not a mushaf" where relevant, and a review-state. No feature
   ships that can rewrite, auto-translate, or obscure sacred text.
7. **Validate in the open.** GitHub issue voting for the next two features;
   publish QA sheets (all templates × frames × locales) in the issue. No
   telemetry — the repo's privacy rule is non-negotiable.
8. **Kill the scope early.** If S3 (design system) does not visibly raise
   reuse, stop at S2 + S4 and ship the honest, smaller tool. V1's discipline
   is the reason this project is trustworthy; do not spend it.

---

## 8. Test strategy (the part that makes it trustworthy)

| Layer | What | Cost | Catches |
| :-- | :-- | :-- | :-- |
| Pure layout | Stub measure: all frames × variants × 1–3 blocks, 2:282 fixture | s | Slicing, overflow, size floors |
| **Full-Quran sweep** | `layoutCard` on all **6,236 ayat** in each frame at min size — every single ayah must fit alone | ~2 s in CI | Any future typography change that breaks a verse |
| Grapheme | Random long words: assert no line starts with a combining mark | ms | The V1 hard-split defect |
| Golden | `toMatchSnapshot` of layout JSON for 8 canonical cards (change pinned manually) | s | Silent geometry regressions |
| Export | `.card.json` round-trip, deep-link parse, iTXt chunk readable | ms | Provenance loss |
| Registry | Every dataset has full metadata + `reviewState` | ms | Unreviewed content shipping |
| Budget | Route chunk + per-surah data + fonts under caps | ms | Bundle creep |
| a11y | eslint + keyboard walkthrough + `aria-label` contains full text | s | Screen-reader blindness of the canvas |
| Visual QA | Template sheet rendered in-browser (not in CI) | — | Aesthetic regressions (human) |

---

## 9. Risks & mitigations

| Risk | Impact | Mitigation |
| :-- | :-- | :-- |
| DOM measurement drifts from canvas across engines | Layout mismatch in export | S0(a) spike; a 1 px tolerance gate; fallback to canvas-only (no justification) documented |
| Scope creep toward Canva | Project loses focus; bundle grows | Feature budget; byte budget in CI; explicit reject list (§3.4) |
| Unreviewed community content ships | Religious integrity | Registry + CI gate + review-state before `available` |
| Translation licensing mistake | Legal/reputational | Separate dataset, license verified, attribution mandatory, never AI |
| Font bloat | Slow on 3G | 60 kB cap, subset + lazy per template, budget CI |
| Safari/iOS shaping differences | Different cards per device | Cross-device QA sheet before release; one layout model, browser shaping |
| Contributor fatigue on review | Pipeline stalls | Per-chapter PRs (~5 kB), checklist-driven, two-reviewer rotation |
| Text "improvement" creeping in (typos fixed silently) | Text no longer verbatim | Verbatim test; no normalization path exists in code |

---

## 10. Decisions & open questions

**Tracking issue:** #19 (V2) — follow-on to #16 (V1).

### Decided (2026-09-13)

1. **Translation** → *V2.1, license-gated.* Public-domain only, its own
   dataset + registry entry, attributed, visually separated, never AI. Not a V2
   core pillar (stage S8, optional).
2. **Engine sharing** → *Keep the engines separate.* Share only low-level
   primitives (`lib/text-layout`, `lib/image-export`, fonts). One engine
   serving two honest-status tools becomes a lowest-common-denominator.
3. **Sequencing** → *Roadmap issue first* (#19), then spikes, then features.
   One focused PR per stage.

### Still open (answer before S0 / S5)

4. **Who reviews?** Domain-review capacity is the real schedule risk.
   (Recommend: a two-reviewer rotation + a public reviewer roster in
   `METHODOLOGY.md` before S5.)
5. **Contributions: curated invites or open intake?** (Recommend: curated
   invites until the pipeline proves itself — 2–3 trusted contributors.)
6. **Surah-page citations?** (Recommend: yes in V2.1 if the data license is
   clean — page numbers are what people verify against.)
7. **Do we ship 2:282 as an official "long verse" template?** (Recommend: yes —
   it is the honest stress test and a shareable "longest verse" card.)

---

## 10a. What has shipped (2026-09-13)

Everything in stages **S1–S4 and S6–S7** is implemented and verified; **S5**
(contribution intake) and **S8** (translations) remain open by decision.

| Item | State | Evidence |
| :--- | :--- | :--- |
| Grapheme-safe wrapping (V1 defect fixed) | done | `engine/linebreak.ts` + tests: no line starts with a combining mark |
| DOM-mirror measurement | done | `engine/measure.ts`; layout measured with the drawing font stack |
| Word-level justification (no kashida) | done | `render/canvas.ts` draws measured words; strings stay byte-identical |
| Template system (20 templates as data) | done | `engine/templates.ts`, thumbnails rendered by the real engine |
| Procedural ornament + pattern kits | done | `render/ornaments.ts`, `render/patterns.ts` — zero image assets |
| Contrast + legibility guard | done | `render/palette.ts` (WCAG math), layout reports `legible` |
| Dataset registry + CI gate | done | `src/data/datasets.ts` + `datasets.test.ts` |
| Undo/redo | done | `engine/blocks.ts` reducer; verified in-browser (add → undo → redo) |
| Project files (`.card.json`) | done | round-trip verified in-browser |
| Deep links + verify QR | done | QR **decoded from the exported PNG** by an independent scanner |
| Provenance in the PNG (iTXt) | done | `Description` + `Software` chunks, verified in the downloaded file |
| Series/carousel ZIP | done | store-only writer, valid archive verified in-browser |
| Print sheet (A5/A4) | done | `print.ts` + print portal |
| Contribution template | done | `docs/contributions/duas-hisn-template.md` |
| Full-Quran sweep | done | all 6,236 ayat render alone in a square card |
| Byte budget in CI | done | `scripts/check-bundle-budget.mjs`, wired into the workflow |

**Bugs found and fixed while building (worth recording):** the V1
character-level hard split; ZIP fields written big-endian; QR format-info
bit-order, alignment-pattern polarity, and the v8–v10 block table — each caught
by a test and confirmed against a real QR scanner.

**Still human, not code:** Safari/iOS typography review (the kill criterion for
spike S0(a)), the reviewer roster, and the two `candidate` datasets moving to
`verified`.

## 11. What "done" looks like (V2)

Code work shipped; the boxes left open are human gates, not engineering.

**Shipped**

- [x] Every text path: verbatim, cited, attributed, review-state tracked.
- [x] 20 templates, procedurally art-directed, all frames/locales/legibility
      floors, byte budget green.
- [x] Measured typesetting: justified Arabic without a single changed character.
- [x] Project files + deep links + QR + embedded provenance.
- [x] Registry enforces metadata; 14 duas, 2 curated quotes, 6 occasions.
- [x] Full-Quran sweep (all 6,236 ayat), palette-contrast + registry + export
      + untrusted-input tests green (22 files, 193 tests).
- [x] `METHODOLOGY.md` documents sources, integrity rules, and the review gate.

**Human gates before `available`**

- [ ] Safari + iOS QA sheet published; a11y checklist signed (S0(a) kill
      criterion — cannot be settled from a Chromium-only environment).
- [ ] 50+ duas reviewed; the two `candidate` datasets (duas, curated quotes)
      promoted to `verified` by a named domain reviewer.
- [ ] 2 reviewers onboarded.
- [ ] Domain review requested and signed off.

---

*See also: `docs/design-studio-analysis.md` (the V1 analysis that led here),
`src/tools/card-studio/METHODOLOGY.md` (V1 sources + review gate),
`docs/islamic-tools-roadmap.md` D1 (merged into Card Studio),
`AGENTS.md` (hard rules this plan obeys).*
