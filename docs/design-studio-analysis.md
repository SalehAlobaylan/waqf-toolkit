# Design Studio Tool — Deep Feasibility Analysis

> **Status:** analysis only, not an implementation commitment. Adding this tool still requires a catalog entry in `src/data/tools.ts`, English + natural Arabic copy in `src/i18n/{en,ar}.ts`, sitemap entries in both locales, a public roadmap issue, and — where marked — a completed `METHODOLOGY.md` + domain review.
> Last updated: 2026-09-03

---

## 0. TL;DR

**Yes, it is possible — and it fits `waqf-toolkit` perfectly.**

A "design studio for Dua / Quran / scholar words → sharable image or text" is technically a *browser-only* tool, which is exactly what `src/data/tools.ts:35` (`processing: 'browser'`) and `AGENTS.md` encourage. No server, no `vercel.json`, no uploads.

**But "design studio" covers three very different weights. Do not build a Canva clone on day 1:**

| Scope | What user gets | Bundle weight | Risk | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **A) Card Maker** | Pick text (Ayah / Dua / Athar) + 5–6 locked templates + export `1080x1080` / `1080x1920` PNG + Copy text | Light–Medium (~40kb code + fonts lazily loaded) | Low | **Ship this first. Ideal first build.** |
| **B) Template Composer** | A + combine 2–3 blocks (e.g. Ayah + translation + Dua) via *layout variants* (not free drag) | Medium (~60kb + fonts) | Medium | Natural v2 once A validates |
| **C) Freeform Studio** | Full drag / resize / rotate layers, upload background, undo history — like Canva | Heavy (+95–280kb canvas lib + font complexity) | High — violates "Good tools stay small" (`AGENTS.md:354`, `CONTRIBUTING.md`) | Defer until A/B get traction |

**Recommendation: Ship A → validate → expand to B. Only do C if users explicitly ask for freeform.**

If you ship only A, you already have the #1 requested sharable Islamic tool with zero backend.

---

## 1. Why it fits the project

### 1.1 Against the three principles (`AGENTS.md`)

1.  **Instant & everywhere** — open link, make card, download. No account. Works on phone in mosque.
2.  **Honest status** — `status: 'experimental'` until `METHODOLOGY.md` passes domain review. Never fake `Available`.
3.  **Limits are visible** — every card exports with `surah:ayah`, dataset version, processing note, and warning (`"calculated — may differ"`, `"copy faithfully — do not crop Quran text"`). The same rule that makes `src/tools/qibla-finder/METHODOLOGY.md` and `src/tools/hijri-converter/METHODOLOGY.md` mandatory.

### 1.2 Where it sits vs. existing ideas

This complements `docs/islamic-tools-roadmap.md:408` **D1. Quran Card Atelier** (verbatim Quran + translation on a card) but generalizes it: Dua + Athar + Quran, and optionally *combined* blocks. If both exist, this tool is the broader "studio" and D1 is the stricter Quran-only atelier. Pick one name to avoid duplication — suggested slugs: `dua-card-maker`, `ayah-card-studio`, or `islamic-card-atelier`.

---

## 2. Is it heavy? Technical breakdown

### 2.1 Two implementation paths

#### Path 1 — DOM → Image (Recommended for A/B)

Render the card as normal HTML + Tailwind (you already have RTL-correct typography), then snapshot to PNG via `modern-screenshot` or `html-to-image` (~30kb gz).

```
[ React DOM (Tailwind, dir="rtl") ] → modern-screenshot → canvas.toBlob() → PNG download
```

**Pros:**
- RTL + bilingual free — `src/routes/__root.tsx` already sets `dir="rtl"` from URL.
- Reuses existing design system (`src/components/ui.tsx`, Tailwind v4).
- Arabic shaping / ligatures / kashida handled by browser, not your code.
- Smallest bundle, best mobile perf.
- Text remains selectable before export (accessibility + copy).

**Cons:**
- Font embedding must be inlined before snapshot (extra step).
- `html-to-image` can clip shadows/filters on Safari — needs QA.

#### Path 2 — Canvas Engine (Only for C)

Use `Fabric.js` (~280kb gz) or `Konva` (~95kb) with `OffscreenCanvas`. Full layer model, drag/resize/rotate, history stack.

**Pros:** True freeform studio.

**Cons:**
- You re-implement text layout. `<canvas>` `fillText` breaks Arabic lam-alif ligatures and line wrapping. Workarounds exist but are fragile across Chrome vs Safari.
- Bundle 3–5× larger.
- Touch drag, pinch-zoom, keyboard a11y all become custom work.
- `useSyncExternalStore` snapshot caching rule (`AGENTS.md`) applies to canvas history state.

**Verdict:** Start with Path 1. Graduate to Path 2 only if template variants prove insufficient.

### 2.2 What actually dominates bundle size

Not code — **fonts and text data**:

| Asset | Size | Mitigation |
| :--- | :--- | :--- |
| **Amiri** (OFL, Arabic body) | ~180kb WOFF2 full | Subset to Arabic + Latin, `font-display: swap` |
| **Scheherazade New** (OFL, Uthmani-like) | ~220kb WOFF2 full | Load lazily only when Quran mode active |
| **KFGQPC Uthman Taha Naskh** (Madinah mushaf) | Check license — not all builds are OFL. Verify before bundling. | Prefer Amiri/Scheherazade unless license is clear. |
| **Quran Uthmani JSON** (Tanzil) | ~1.2MB raw → ~430kb gz + Brotli | Load by surah on demand, not upfront. Keep checksummed + versioned. |
| **Hisn al-Muslim duas** | ~180kb JSON | Lazy-load by chapter |
| **Scholar Athar** | Small, but needs curation | Bundle only after licensing review |

**No server workarounds needed.** `vite.config.ts:11` Nitro `vercel` preset is irrelevant here — everything is `Canvas.toBlob()` in the browser, no API route, no key, no `cloud-api` unless you later call Quran Foundation.

### 2.3 Export & processing model

```ts
// src/data/tools.ts sketch
{
  slug: 'dua-card-maker',
  status: 'experimental',
  processing: 'browser',
  processingNote: 'All rendering and export happens in your browser — text and images never leave. Fonts loaded locally, nothing is uploaded.',
  providers: [], // no cloud-api
  category: 'Everyday',
}
```

- Image: `canvas.toBlob('image/png', 1.0)` or `image/jpeg` (smaller, but PNG preserves calligraphy).
- Text: `Copy text` mode for WhatsApp / accessibility + machine-readable `Copy JSON` that retains `surah:ayah`, `datasetVersion`, `translationSource`, `generatedAt`.
- Offer `1080×1080` (feed) + `1080×1920` (story/status) + `A5` print. All via same DOM snapshot at different DPR (2× for retina).
- Drafts: `localStorage` opt-in vault (same pattern as `src/lib/saved-tools.ts` + `zakat-calculator` local save) with visible "Clear draft." No auto-persist without consent.

---

## 3. The hard part — religious content is not just data

Per `AGENTS.md` "Sensitive domain changes": methodology + named sources + sign-off before `available`. Same gate as `src/tools/prayer-times/METHODOLOGY.md`.

### 3.1 Quran

- **Source:** One named, checksummed dataset (e.g. `Tanzil.net Uthmani CC BY 3.0 verbatim`) with version + checksum in `METHODOLOGY.md` and in every export. Do not switch between Tanzil and QuranComplex silently.
- **Typography:** Use Uthmani font. System fonts mangle Uthmani. Test shaping on Safari/iOS — it differs from Chrome.
- **Citation:** Every card shows `Surah Name • 2:255` + `dataset vX.Y`. Never split an Ayah mid-sentence without `…` indicator. Never let user crop Quran block so text is truncated — block export rather than clip invisibly (same integrity rule as `docs/islamic-tools-roadmap.md:127`).
- **Translation:** Keep Arabic and translation visually separate, each attributed (`Translation: Sahih International vX`). Do not let browser spellcheck/normalization touch Quran text (`spellcheck=false`, no AI rewriting).
- **Disclaimer in export:** `"Arabic preserved verbatim from [source]. Not a mushaf — handle respectfully."`

### 3.2 Dua

- **Best corpus:** `Hisn al-Muslim` (~130 chapters, graded). It is authentic, structured, and citable: `Hisn 86 — Bukhari 6306`. Avoid scraping random dua sites.
- **What to store:** `arabic`, `transliteration` (optional), `translation`, `source`, `grading`.
- **Export retains** chapter + source so forwarding doesn't strip provenance.

### 3.3 Scholar words (Athar)

- **Highest risk.** Needs `author — book — page / number — Arabic original + translation attribution`.
- **Copyright:** Living scholars' contemporary books are copyrighted. Prefer public-domain classical texts (Ibn al-Qayyim, Ibn Taymiyyah) or get explicit permission. Do not scrape Twitter/X quotes.
- **Misattribution:** "Scholar says:" without chain is how weak/fabricated Athar spreads. Require `book` field before export is allowed.
- **Recommendation:** Defer Athar to v2. Launch with Dua + Quran only, then add Athar once a curation pipeline + reviewer exists. This keeps v1 out of the high-risk lane.

### 3.4 Combining 2–3 texts in one design

Don't allow free overlap of Quran + other text — different sanctity. Instead:

- Offer **layout variants** that are pre-reviewed: `Ayah top / Dua bottom · separated rule`, `Ayah center + small translation below`, `Dua + Athar side-by-side (no Quran)`.
- Never put Quran text underneath another opaque layer.
- Variants are `radio` choices, not free dragging — keeps output beautiful and prevents accidental disrespect.

---

## 4. UX — what makes studios feel heavy (and how to stay light)

- **Template > Blank canvas.** Users want beautiful in 15 seconds. Research (Canva): ~90% start from template. Provide 6 curated palettes (cream, deep green, night, mosque arch line-art, minimal) — not free color pickers.
- **RTL is non-trivial on canvas.** Path 1 solves this. If Path 2, you must set `ctx.direction = 'rtl'` + manual bidi — test with long Dua that wraps to 3 lines.
- **Arabic line-height:** `1.9–2.1` for Uthmani, `1.6` for UI. Don't reuse body line-height for card.
- **Accessibility:** Generated PNG must have `alt` / accompanying text. Provide `Copy text` alongside `Download PNG` — screen readers need it.
- **Mobile:** Fat tap targets, no hover-only controls, pinch not required. Test `modern-screenshot` DPR handling on iOS — older versions rasterize at 1×.
- **Background uploads (defer):** If allowed, handle EXIF rotation client-side + warn "image stays in browser" + strip EXIF before export. Adds moderation surface — skip in v1.

---

## 5. Risks vs. mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Quran text rendered incorrectly / clipped | **Critical** — religious integrity | Checksummed dataset, blocked export on truncation, domain review, fixture tests in CI |
| Scholar quote misattributed | High | Require `book + page`, defer Athar to v2, reviewer-owned corpus |
| Bundle bloat from fonts | Medium — slow on 3G | Subset WOFF2, lazy-load Uthmani, `preload` only active font |
| User mistakes image for authenticated mushaf | Medium | Watermark `source + surah:ayah` *inside* image so forwarding doesn't strip it |
| Scope creep to Canva | High — project loses focus | Enforce `templates + variants` not freeform; PRs stay focused per `AGENTS.md` |
| i18n parity failure (`tsc` fails) | Low but blocks CI | Add all strings to both `src/i18n/en.ts` + `ar.ts` before merge |

---

## 6. Catalog & file sketch (when you decide to build)

**Catalog entry (`src/data/tools.ts:79`):**
```ts
{
  slug: 'dua-card-maker',
  name: 'Dua & Ayah Card Maker',
  shortDescription: 'Turn a Dua or Ayah into a sharable card — elegant Arabic typography, ready to share.',
  description: 'Pick a verified Dua or Ayah, choose a restrained template, and export a clean image or text card. Arabic preserved verbatim, source always shown.',
  category: 'Everyday',
  status: 'experimental',
  license: 'Apache-2.0',
  stack: ['TypeScript', 'Canvas API'],
  processing: 'browser',
  processingNote: 'All rendering and export happens in your browser — text and images are never uploaded.',
  translations: { ar: { name: 'صانع بطاقات الأدعية والآيات', /* ... */ } },
  supportedFormats: ['PNG', 'JPG', 'TXT'],
  featured: true,
  tryRoute: true,
  updatedAt: '2026-09-03',
}
```

**File tree:**
```
src/tools/dua-card-maker/
├── METHODOLOGY.md          # sources, font licenses, dataset checksums, combining rules
├── engine.ts               # template → layout model (pure, testable)
├── templates.ts            # 6 curated palettes + layout variants (versioned)
├── datasets/
│   ├── quran-uthmani.json  # Tanzil checksummed slice, lazy import
│   └── hisn-al-muslim.json # structured Dua corpus
├── dua-card-maker-try.tsx  # UI — picker + studio + export
└── engine.test.ts          # variant → layout, export JSON retains provenance
public/sitemap.xml           # add /en/tools/dua-card-maker + /ar/...
```

**Definition of done:**
- [ ] `METHODOLOGY.md` with dataset table (`source, version, license, checksum, corrections URL`)
- [ ] Font licenses verified (OFL ok, KFGQPC checked)
- [ ] 6 templates render correctly in both locales + both DPRs + print
- [ ] Export JSON/PNG retains `surah:ayah` / `hisnId` + version + warning
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` green
- [ ] Domain reviewer sign-off before `status: 'available'`

---

## 7. Delivery sequence

**Phase A — Card Maker MVP (2–3 weeks, recommended first ship):**
Picker (Hisn + Quran), 6 templates, DOM→image, `1080×1080` + `1080×1920` + Copy text, local draft.

**Phase B — Composer (2 weeks):**
Layout variants for combining 2–3 blocks, translation toggle, per-card QR "verify at source" (optional).

**Phase C — Studio-lite (only if demanded):**
Single-layer drag/resize via Konva, background color/image (still browser-only), history undo.

**Explicitly out of v1:** user-uploaded backgrounds, AI-generated text/translation, cloud lookup, accounts, stock image library.

---

## 8. Open questions for the builder

1. **Priority:** Dua-first vs Quran-first? *Suggested: Dua-first — lowest sensitivity, highest shareability, fastest review.*
2. **Combining needed in v1?** If not, A is half the code.
3. **Backgrounds:** Must v1 allow user-uploaded images, or are curated gradients/patterns enough?
4. **Scholar words in v1?** If yes, who curates and reviews the corpus?

Answer those four and the next step is a one-page PR for `src/data/tools.ts` + `METHODOLOGY.md` skeleton.

---

*See also: `docs/islamic-tools-roadmap.md:408` (D1 Quran Card Atelier — stricter Quran-only sibling), `src/tools/qibla-finder/METHODOLOGY.md` (template for disclosure), `AGENTS.md` hard rules on bilingual + honest status.*
