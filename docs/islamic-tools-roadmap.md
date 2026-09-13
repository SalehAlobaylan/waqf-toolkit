# Islamic Web Tools — Roadmap & Creative Opportunities





### PILLAR — Knowledge & Wealth Purity
*Source-faithful, never AI-rewritten.*

#### D1. Quran Card Atelier — مرسم البطاقة القرآنية

**Why now / creative twist:** Roadmap's `Quran Citation & Sharing Tool` is exactly right — "select a passage, cite it beautifully without retyping sacred text." Twist: make it an **atelier** — Uthmani text preserved verbatim + translation kept visually separate + one-tap plain/Markdown/image-card export that carries the attribution *inside* the image, so forwarding doesn't strip the source.

**User job:** "Let me pick 2:255, verify it, and copy a clean, accurately cited Arabic + translation card without retyping."

**MVP:**
- Select surah + single ayah or contiguous range.
- Show immutable Uthmani Arabic from **one named, checksummed dataset** (Tanzil CC BY 3.0 verbatim — attribution required, no changes). Optionally include a separately licensed, attributed translation (translation license evaluated individually — Tanzil's Arabic license ≠ translation license).
- Copy as plain text, Markdown, or restrained image card (Arabic + surah:ayah + translation name + dataset version + one-click "verify at source" link).
- Integrity: canonical strings stored separately from display formatting; block export rather than clip an ayah invisibly; exact fixture + checksum tests in CI.

**Processing:** Bundled dataset → `browser`; Quran Foundation API → `cloud-api` with `providers: ['Quran Foundation']` via server proxy and pre-use disclosure. Choose one and state it.

**Methodology & risk:** High if sloppy. Must never run browser translation/spellcheck/normalization over Quran text; must keep Arabic and translation distinguishable and separately attributed. Needs domain + typography review.

**Effort:** M · **Phase: 2** — after dataset/licensing/font review.

#### D2. Hadith Lens — عدسة الحديث

**Why now / creative twist:** Roadmap's `Hadith Reference Finder` — companion to D1, sharing the same dataset-record discipline. Twist: **lens**, not search engine — in v1 you *locate* by collection/book/number and *verify* a citation, rather than asking "find a hadith that says…" and receiving an AI ranking. Grading is the source's, shown verbatim.

**User job:** "Is this hadith in Bukhari/Muslim? Show me the exact Arabic, licensed translation, narrator chain, collection/book/number and the source's grading — to copy with full provenance."

**MVP:**
- Select collection, book, reference number; exact-word search within a *curated, licensed* set.
- Display: Arabic, licensed translation, narrator, collection/book, reference numbers, source-supplied grading where present, dataset version/date, link to source record.
- Copy citation retains all provenance; Arabic/translation stay separated and attributed.
- Must not: claim one universal grading, merge numbering systems without mapping, generate a grading/explanation/translation with AI, or scrape unlicensed sites.

**Processing:** Small licensed bundle → `browser`; project-hosted index → `server`; provider API (e.g. HadeethEnc) → `cloud-api` with provider named — see roadmap §8 for the spike criteria.

**Methodology & risk:** Very high for data/licensing; low for UI once a dataset record (source/version/license/checksum/corrections URL) exists.

**Effort:** L (mostly spike) · **Phase: 4** — data/licensing spike first.

#### D3. Halal Purification Ledger — دفتر التطهير

**Why now / creative twist:** Mizan Wealth's headline insight ("purifying stock portfolios") + App Store "Halal Investment Screening" — but most Muslims don't need a screener that pretends to certify stocks; they need a **ledger** that answers: "This dividend — how much do I purify?" Twist: no stock database, no server lookup. You enter haram revenue % (from the company's report or your advisor); the tool multiplies — honest arithmetic, not a halal sticker.

**User job:** "ETF paid $200; company reports 12% haram revenue — how much of that $200 do I purify? Add 3 holdings and give me a total for my accountant."

**MVP:**
- Row: symbol (free text, no lookup), dividend (cash + currency), self-declared haram % — with an AAOIFI Standard No. 21 threshold tape beside it (debt ≤33%, interest ≤5% etc., non-judgmental explainer — "verify with your board").
- Engine: `purification = dividend × haram%` (exact decimal), grand total = sum rows.
- Output: per-holding table + grand total, CSV/PDF, disclaimer: "Arithmetic helper — not a halal certification."

**Processing:** `browser` — `"Holdings stay in your browser. No lookup is performed."`

**Methodology & risk:** Low–medium for the math; **very high if you ever bundle a stock database** — that requires ongoing financial-data licensing + screening-board rulings. Keep v1 user-entered.

**Effort:** S–M · **Phase: 3**

#### D4. Wudu & Salah Cards — بطاقات الوضوء والصلاة

**Why now / creative twist:** Built-in Saudi proves step-by-step cards work (Hajj guide with rukn/wajib labels). NoorTab ships "How to Pray Salah" with rakat tables; reverts/kids/parents need a printable, offline visual guide that doesn't stream video. Twist: **A5 cards you laminate** — wudu + nullifiers + rakat patterns (Fajr 2, Zuhr 4…), each step with Arabic + transliteration + translation, madhhab-neutral baseline with a small callout (e.g. wiping head), illustrated with line-art that avoids photo faces — ready for mosque walls and bathroom doors.

**User job:** "Print me a set I can laminate for the bathroom/wall — wudu steps and the 4 rakat patterns — for a child or new Muslim."

**MVP:**
- Viewer: swipeable cards (line-art placeholders), each step shows Arabic + transliteration + translation + count.
- Sources: wudu from Quran 5:6 + authentic Sunnah (cited per card); rakat tables sourced, never AI-generated; madhhab-neutral with small difference callouts.
- Export: A5 double-sided cards, A3 wall poster, foldable pocket booklet PDF (ar/en). No video/audio capture — keeps it browser-only and mosque-distributable.

**Processing:** `browser` — `"Cards are rendered locally from bundled, cited text."`

**Methodology & risk:** Medium. Must be verbatim + cited; must not improvise translations (Tanzil's Arabic CC BY 3.0 ≠ translation license). Same integrity rule as D1.

**Effort:** M · **Phase: 3** — reuses print pipeline.

---

## 6. The four original calculation engines — where they stand

These are not "creative ideas" — they are the standing commitments from the original roadmap. They keep their gate and live beside the creative studios above, not in competition with them. All four are browser-first, variant-explicit, and gated on `METHODOLOGY.md` + domain sign-off.

### 6.1 Prayer Times Calculator

*User job:* Calculate Fajr, sunrise, Dhuhr, Asr, Maghrib, Isha for a chosen location/date with the convention visible and adjustable. Already exists as `prayer-times-widget` (experimental) — this section is its completion spec.

**MVP:** Manual lat/long default + permission-gated geolocation; Gregorian date + IANA timezone (never infer TZ from longitude); named method or custom Fajr/Isha angles; Asr school; high-lat rule; polar resolution; rounding; minute adjustments; six times + method/coords/TZ/adjustments displayed; JSON/CSV with methodology metadata.

**Outside MVP:** Adhan audio/notifications/background alarms, auto mosque selection, IP-based regional defaults, iqamah times (mosque-supplied — see A2).

**Sources:** `adhan-js` parameter model as reference shape (checked against institutions' current publications), PrayTimes method table as cross-check — a library name is never validation. Institutional timetables are the test fixtures.

**Processing:** `browser`

**Verification:** Riyadh, Makkah, London, Oslo, New York, Jakarta, southern hemisphere; DST + year boundaries; both Asr; all high-lat rules; polar unresolved → explicit state, never `NaN` or silent fallback; en/ar RTL.

**Build:** `src/tools/prayer-times/engine.ts` pure boundary, `methods.ts` versioned preset data, `prayer-times-try.tsx` localized UI, `METHODOLOGY.md` completed, epoch-ms internally / format at boundary, TZ handling separate from solar math.

**Gate:** Methodology doc + reference set approved before leaving `planned`.

### 6.2 Qibla Finder

*User job:* Given a location, show the initial true-north bearing of the geodesic to the Kaaba and explain how to use it without overstating phone-compass accuracy.

**MVP:** Manual coords + optional geolocation; numeric bearing clockwise from true north; static dial alignable to map true north; Kaaba coordinate + WGS84 vs sphere choice + model shown; copyable result with coords/bearing/model/timestamp.

**Live-compass phase:** Later, experimental, with calibration warning and fallback — `DeviceOrientationEvent.requestPermission` is limited-availability and magnetometers are sensitive to cases/metal.

**Sources:** One reviewed, named, versioned Kaaba coordinate; `geographiclib-geodesic` inverse (initial azimuth); documented geometric interpretation of "direction" reviewed separately.

**Processing:** `browser` (no map tiles)

**Edge cases:** At Kaaba → "direction not needed"; near-antipode → ambiguity stated; poles/invalid coords; reviewed reference bearings.

**Existing:** `qibla-finder` (experimental, true-north bearing, no compass required) implements the static bearing — this section is its completion spec.

### 6.3 Hijri–Gregorian Converter

*User job:* Convert between Gregorian and a *named* Hijri variant, while explaining why sighting may differ.

**MVP:** Bidirectional; two variants explicit — **Umm al-Qura** + **Civil (Tabular)** — shown in result + copied text; permanent warning "calculated may differ 1–2 days from local sighting"; Arabic/Latin digits as formatting only.

**Sources:** Do not expose "Islamic calendar" generically — CLDR distinguishes `islamic-umalqura` / `islamic-civil` / `islamic-tbla` / sighting variants. Browser `Intl` support is for formatting; the engine is a bundled, versioned dataset/algorithm with documented epoch, leap scheme, range (Umm al-Qura's range is bounded) and out-of-range behavior. `Intl.supportedValuesOf('calendar')` notes its fallback.

**Processing:** `browser` — no location needed

**Tests:** Known pairs against pinned dataset; first/last supported dates; month/year boundaries, leaps, round trips; explicit failure outside range; identical under en/ar locales except digit style.

**Existing:** `hijri-converter` (experimental) — continue only with explicit variants.

### 6.4 Zakat Calculator

*User job:* Help a user organize eligible assets and produce a transparent estimate under a clearly selected methodology — a *worksheet*, never a ruling.

**First scope (monetary assets only):** Cash/bank, gold/silver by weight+purity, readily realizable investments (user-entered), receivables, eligible short-term liabilities *only if* the chosen methodology includes them, manual gold/silver price + currency, hawl confirmation. Output: itemized worksheet (included/excluded/deducted, nisab basis/value, zakatable base, rate 2.5% = 1/40, estimate, methodology version, unresolved questions).

**Out of scope v1:** Crops/livestock/minerals/inventory/pensions/trusts/multi-currency FX live/tax jurisdiction, live metal-price fetch, a single hidden gold-vs-silver nisab default, or any sentence that Zakat is definitively due.

**Sources:** Scholar-led; candidate baseline AAOIFI Standard No. 35 on Zakah — but applicability + recognized differences + regional expectations must be reviewed explicitly. Methodology must cover asset categories, valuation date, gold/silver nisab weights, lunar vs solar hawl/rate, jewelry/receivables/debts/investments, rounding, and which cases it refuses to decide.

**Processing:** `browser` — financial values stay in memory; no `localStorage` by default; explicit local JSON/PDF export with sensitive-data warning.

**Implementation:** Decimal/rational arithmetic, method rules as reviewed data, full calculation trace, scholar-approved scenario corpus *before* `available`.

**Existing:** `zakat-calculator` (experimental) — do not touch UI until a domain reviewer has approved the methodology and reference scenarios.

---

## 7. Definition of done for every Islamic tool

- [ ] English and natural Arabic are complete and reviewed by a native speaker (formal but slightly casual, no decorative religiosity).
- [ ] RTL, mobile, keyboard, screen-reader, print, `.ics` and reduced-motion behavior tested where applicable.
- [ ] Processing location is literally accurate and shown *before* sensitive input.
- [ ] `METHODOLOGY.md` completed where any calculation or canonical text is involved (see `docs/templates/calculation-methodology.md`).
- [ ] Every dataset has `source, version, license, checksum, update policy, corrections URL` and a CI checksum test.
- [ ] Every recognized convention/school difference is visible or explicitly out of scope.
- [ ] Reference fixtures cite an independent source of truth (not another app using the same library).
- [ ] Errors and unsupported cases stop visibly — no silent fallback, never `NaN`.
- [ ] Copied/downloaded/copied-image results retain `method/source/limitation` notices — warnings survive forwarding.
- [ ] Domain-aware maintainer sign-off is recorded on the tracking issue.
- [ ] `src/data/tools.ts` catalog entry + both `src/i18n/{en,ar}.ts` strings + `public/sitemap.xml` in both locales + roadmap issue + `lint && typecheck && build` all pass before `available`.

---

## 8. Source shortlist for methodology work

These are *candidate inputs to review*, not endorsements. Each tool's reviewer approves the exact set.

- Waqf calculation methodology template — `docs/templates/calculation-methodology.md`
- `adhan-js` prayer-time library — https://github.com/batoulapps/adhan-js
- PrayTimes method comparison — https://praytimes.org/docs/methods
- GeographicLib JS geodesic — https://github.com/geographiclib/geographiclib-js
- Unicode CLDR Islamic calendar variants — https://cldr.unicode.org/translation/displaynames/locale-option-names-key
- MDN `Intl.supportedValuesOf('calendar')` / Calendar behaviour — https://developer.mozilla.org
- AAOIFI Standard No. 35: Zakah — https://aaoifi.com
- AAOIFI screening / purification thresholds (via Mizan Wealth / al-mizan references)
- Quran Foundation API — https://api-docs.quran.com/docs/api-reference/
- Tanzil Quran text + license (CC BY 3.0 verbatim) — https://tanzil.net/docs/text_license
- Encyclopedia of Translated Prophetic Hadiths API — https://hadeethenc-content.islamcontent.com/en/developers_api
- FaraidHub / ShariaWiz / IslamicFinanceCalculator Faraid docs — for furud/asabah/hajb/awl/radd catalogues (checked against Quran 4:11, 4:12, 4:176)

---

*Where to start: open three tracking issues — **A1 Khutbah Studio, A2 Mosque Publisher, C3 Fitrana Express** — and draft their `METHODOLOGY.md` / dataset records before UI. That keeps review load small and puts something printable in mosques and homes this month, while Phases 2–4 lay the variant-discipline and sensitive-arithmetic groundwork for the ateliers ahead.*
