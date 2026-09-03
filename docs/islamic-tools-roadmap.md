# Islamic Web Tools — Roadmap & Creative Opportunities

> **Single source of truth.** Merges the original 10-tool roadmap (2026-08-30) with a deep analysis of `https://built-in-saudi.com/ar/c/islamic` (12 tools) and a market scan of 30+ live Islamic calculators (CalcTypes, FaraidHub, ShariaWiz, App Store "26 Calculators", Falah, Mizan Wealth).
> Last merged: 2026-09-03 — v3 creative
> Status: product analysis, not an implementation commitment. Adding any tool still requires a catalog entry in `src/data/tools.ts`, English + natural Arabic copy, sitemap entries in both locales, a public roadmap issue, tests, and — where marked — a completed `METHODOLOGY.md`.

---

## 0. Executive synthesis

**Built-in Saudi is a masterclass in Saudi-tuned `ibadah` utilities** — 12 single-purpose, mostly-browser, no-account tools that do prayer times (Umm al-Qura), Hijri conversion/calendar, qibla, zakat, Hisn/Adhkar, Hajj/Umrah, Istikhara, Khatma (604-page footnote), age and timetables brilliantly.

**It is also deliberately narrow.** It hard-codes Umm al-Qura + Saudi cities, shows no variant, and covers zero of the family lifecycle: no *qada* (make-up worship), no *fidya/kaffarah*, no *fitrana*, no *qurbani*, no *aqeeqah*, no *mahr*, no *iddah*, no inheritance/wasiyyah, no halal purification. Every competing directory puts *those* in its top-10 by traffic.

**Waqf already owns the overlap.** Four of Built-in Saudi's 12 are Waqf experimental: `qibla-finder`, `prayer-times-widget`, `hijri-converter`, `zakat-calculator`. Re-cloning them would waste review bandwidth. The original roadmap's best bets — **Khutbah Planner, Mosque Timetable Builder, Quran Citation** — point the same way: browser-only, variant-explicit, source-faithful, and private.

**This v3 is not a longer list of calculators. It is 14 *companions, studios, vaults and ateliers* — one job, one printable/shareable artifact, zero accounts — grouped into four creative pillars.** Each proposal states exactly why it exists, what it exports, where data goes, and what it refuses to do.

If you ship only three, ship the most human trio: **Qada Companion → Iddah Companion → Fitrana Express**. They are the most-searched, most pastoral, and lowest-risk.

---

## 1. What Built-in Saudi actually built

### 1.1 The 12 as listed (live copy, 2026-09-03)

| # | Built-in Saudi slug | Arabic name | Job (one line) | Overlap in Waqf? |
|---|---|---|---|---|
| 1 | zakat-calculator | حاسبة الزكاة | Cash/gold/silver/trade + receivables − debts → 2.5% if nisab+hawl. "تقدير وليس فتوى". Browser. | **Yes** — `zakat-calculator` |
| 2 | prayer-times | مواقيت الصلاة | Daily Fajr→Isha by Umm al-Qura, city/GPS, optional alerts. Browser. | **Yes** — `prayer-times-widget` |
| 3 | hijri-calendar | التقويم الهجري | Gregorian ↔ Hijri (Umm al-Qura), today, Ramadan/Eids. Browser. | **Yes** — `hijri-converter` |
| 4 | islamic-calendar | التقويم الإسلامي | Monthly Umm al-Qura grid, moon phase, white days 13–15, Ramadan/Eids. Browser. | Partial — Waqf converts but has no month-grid/moon view |
| 5 | hisn-al-muslim | حصن المسلم | ~130 chapters, searchable, vocalized Arabic, offline. | No — roadmap: Quran/Hadith citation tools |
| 6 | adhkar | أذكار الصباح والمساء | Morning/evening adhkar, Arabic + transliteration + count + counter + source. | No |
| 7 | hajj-umrah | دليل الحج والعمرة | Step-by-step Umrah (default)/Hajj, rukn/wajib/sunnah labels, progress. Offline. | No |
| 8 | istikhara | دعاء الاستخارة | Prophetic dua (Jabir b. Abdullah, Bukhari) + 2 rak'as how-to. | No |
| 9 | qibla | اتجاه القبلة | Bearing + distance to Kaaba, live compass where available. Browser. | **Yes** — `qibla-finder` |
| 10 | hijri-age | حاسبة العمر الهجري | Birthdate either calendar → exact age y/m/d, total days, next Hijri birthday. Warns 354-day year. | No — converter has no interval math |
| 11 | khatma | مخطط الختمة | Solo plan over N days, split by pages (604 Madinah, stated) or juz, dual dates, printable checkboxes. Browser. | No |
| 12 | prayer-timetable | تقويم مواقيت الصلاة | Printable Saudi-city month Fajr→Isha + Hijri dates, Fridays shaded. Same engine as #2. Browser. | No — roadmap's `Mosque Timetable Builder` planned |

**What to steal:** one job per page, no account, "يعمل في متصفحك" disclosed, Khatma's 604-page footnote (limits visible beats silence), offline-capable.

**Where Waqf can be better:**
- Built-in Saudi hard-codes **Umm al-Qura + Saudi cities**, never exposes `islamic-umalqura` vs `islamic-civil` vs sighting, nor Fajr/Isha angles, nor IANA timezone — Waqf's experimental tools already do.
- **No family fiqh.** No mahr, iddah, inheritance, wasiyyah, qada.
- **No make-up worship.** No fidya/kaffarah, fitrana, qurbani.
- **Readers, not vaults.** Hisn/Adhkar/Hajj/Istikhara are read-only. They never let a user *record private progress* without uploading it. Waqf's browser + opt-in `localStorage` wins for sensitive worship history.
- **Exports lose their warning.** Khatma/timetable print well; prayer times/Hijri mostly don't preserve variant/method in copied text — Waqf's rule ("uncertainty survives export") is the fix.

### 1.2 Waqf today

Experimental, browser-first, variant-explicit: `qibla-finder` (true-north bearing, no compass required), `prayer-times-widget` (method/Asr/high-lat/adjustments exposed), `hijri-converter` (Umm al-Qura vs Civil, with 1–2 day sighting warning), `zakat-calculator` (decimal-precise worksheet, `decimal.js`, not a fatwa). All four already follow the shared rules in §2 and have `METHODOLOGY.md` gates. The original roadmap ranked **Khutbah Planner** and **Mosque Timetable Builder (supplied-times first)** as the best next builds — that ranking survives in this merge, but both get a creative promotion below.

---

## 2. Market scan — what the web proves people search for

Across directories, stores and open-source kits the same cluster repeats — and it is precisely the cluster Built-in Saudi skips.

**App Store "Islamic Calculators — 26 tools" (2025) groups its headline as:**
`Zakat al-Mal • Zakat al-Fitr • Gold/Silver/Stocks/Ushr/Sadaqah` → `Fidyah • Kaffarah • Qada Salah • Qada Sawm • Tasbih • Hajj Budget` → `Inheritance (Mirath) • Qurbani • Aqeeqah • Iddah • Mahr • Nikah` → `Wasiyyah (1/3) • Halal Investment Screening` → `Hijri Converter • Islamic Age`. Every bold item is absent from Built-in Saudi.

**Directories confirm it:**

| Source | Top-listed | Signal |
|---|---|---|
| **CalcTypes** `/islamic-calculators` | Zakat + **Faraid** + **Fitrana**, article body calls out **Qada, Fidya/Kaffarah, Iddah, Mahr** | Methodology page lists Mufti reviewers |
| **NovaCalculator** `/islamic-regional/islamic-tools` ("18 tools") | **Fidya/Kaffarah, Iddah, Inheritance, Will, Mahr**, Prayer Times, Hijri | Same family cluster |
| **FaraidHub** `/tools` (6-tool estate suite) | **Faraid (awl/radd, 4 madhabs), Islamic Will (1/3), Zakat, SA Estate Duty** | Shows how far inheritance/will must go to be shippable |
| **IslamicFinanceCalculator / ShariaWiz** | **Faraid** with full furud table (1/2…1/6), asabah, hajb, awl, radd | Best docs on Quran 4:11–12, 4:176 |
| **Falah.io** (Next.js static, 100% client-side, zero tracking) | Prayer Times, Qibla, **Mosque Finder (browser geo only), Quran Explorer, Inheritance, Zakat** | Closest philosophy to Waqf; still gaps on qada/fidya/iddah/mahr/fitrana |
| **Mizan Wealth** (browser-native, `localStorage`) | **Zakat (live nisab) + Halal portfolio purification** = `dividend × haram%` | Proves purification can be a worksheet, not a screener |

**Three invariant formulas the web agrees on:**
- **Fidya/Kaffarah** = per Bukhari 1936: `feed 1 poor × 2 meals × 60` OR `fast 60 consecutive days` OR historic `free a slave`. School diff: Hanafi allows cash feeding; others prefer food; consecutiveness breaks on illness per madhhab.
- **Iddah** = `3 quru` / `3 lunar months` / `4 months 10 days` (widow, Quran 2:234). Good tools label the rule and refuse to define `quru` length.
- **Fitrana** = `1 saʿ of wheat/barley/dates/raisins ≈ 2.5–3.0 kg per person × household × local cash price`, due before Eid prayer. Weight variant must be shown.
- **Mahr** = `grain → cash` via `grams × purity × price/g`, split **muqaddam (upfront) + mu'akhar (deferred debt)** (Quran 4:4, Bukhari 5149). Mu'akhar is a debt due on divorce/death.

**Gap map:**

```
Lifecycle:  birth ──► marriage ──► daily/yearly worship ──► illness/travel ──► death
Built-in Saudi:       [────── worship times, Hijri, zakat, dhikr, hajj ────── Khatma]
Waqf experimental:    [ qibla | prayer times | Hijri converter |  zakat ]
Market top demand:    [ aqeeqah ─ mahr ─ qada/fidya/fitrana/qurbani/tasbih ─ iddah ─ inheritance/wasiyyah/purification ]  ← unbuilt
```

---

## 3. Creative lenses — how we invented the proposals

We did not just re-list market calculators under new names. Each proposal below is the result of five deliberate twists on the raw jobs above:

1. **Reader → Companion/Vault.** Built-in Saudi *shows* text. The companion *holds private history* (qada marks, iddah dates, mahr record) in `localStorage` after an explicit "Save on this device" — and can be wiped in one tap. No account, no server, no analytics. Worship history is the most sensitive data we handle; the browser is the vault.

2. **Single number → Printable artifact.** A number is easy to forget. A *thing to pin* is not: a 30-day qada grid, an iddah wallet card, a mahr one-pager, a qurbani share sheet, a khutbah one-pager, a mosque A3. Every tool below exports at least one printable + one machine-readable (`JSON/CSV/.ics`) that keeps the warning.

3. **Saudi default → Variant-explicit, global.** Built-in Saudi's strength (Umm al-Qura + Saudi cities) is also its limit. Waqf's edge is to expose the variant: `islamic-umalqura` vs `islamic-civil` vs sighting, Fajr/Isha angles, Asr school, high-lat rule, IANA timezone, and staple-weight — and to support *any* coordinates. Two users in London and Riyadh should see why their numbers differ, side-by-side, without thinking the software is broken.

4. **Standalone calculator → Collective choreography.** Khatma becomes **Khatma Circle** (30 ajza among 7 people), qurbani becomes **Qurbani Collective** (1 cow = 7 shares), timetable becomes **Mosque Publisher** (one CSV → A3 + TV slide + .ics for a whole congregation). The browser choreographs people, not just arithmetic.

5. **Cloud guesswork → Deterministic worksheet.** No live gold/food/stock prices in v1. The user enters the price; the tool multiplies. That keeps every proposal `processing: 'browser'`, deterministic, and testable. Live prices (if ever added) become a `server`/`cloud-api` phase with a disclosed provider and a per-tool warning.

---

## 4. Shared product rules

*Carried from v1 — slightly tightened after the market scan.*

### 4.1 Every result must explain itself

Calculation and content tools show the active method or source *beside* the result, not behind an "about" link. A share or export retains method, dataset version, adjustments, generation date and the relevant warning in the copied text itself.

### 4.2 Recognized differences are configuration, not bugs

Prayer angles, Asr, high-latitude rules, Hijri variants, saʿ weight, `quru` vs lunar months, kaffarah feeding vs fasting, mahr minima and purification thresholds cannot be hidden defaults. If two recognized authorities differ, the choice belongs in the methodology and — where helpful — in the interface.

### 4.3 Prefer deterministic browser processing

Bundled, versioned algorithms/datasets are preferred when licenses allow. They make results reproducible and keep sensitive inputs on-device. A `cloud-api` is acceptable only when its provider, transmitted data, retention, credentials, terms and failure states are disclosed *before* use.

### 4.4 Religious content is immutable source material

Quran/Hadith text is never auto-translated, rewritten, summarized, spell-corrected or AI-graded. UI may reflow presentation, but stored source strings and citations stay verbatim and checksummed against a pinned version (e.g. Tanzil CC BY 3.0 verbatim, Quran Foundation via documented API, HadeethEnc with version).

### 4.5 Uncertainty must survive export

Warnings — "calculated estimate," "user-supplied timetable," "calendar variant may differ 1–2 days from sighting," "educational illustration — not a fatwa/distribution," "grading supplied by source" — must survive `Copy JSON/Copy CSV`, PDF, PNG, `.ics` and print. They are not footnotes; they are part of the result.

### 4.6 Companions are private vaults, not accounts

Qada, iddah, mahr, niyyah histories are sensitive. They live in React state by default, in `localStorage` only after an explicit opt-in, with a visible "Clear all" that actually clears. No analytics, no telemetry, no third-party fonts/editors that could leak keystrokes. Browser-native spellcheck is opt-in for the same reason.

---

## 5. Creative portfolio — 14 proposals

Each is ready to become a `src/data/tools.ts` entry + a `src/tools/<slug>/` route.
Conventions for every entry: `category: 'Everyday'`, `status: 'planned'` until the gates in §7 pass, `license: 'Apache-2.0'` (or `MPL/GPL` where a dataset requires it), bilingual `translations.ar` included, `supportedFormats` covers its exports, `updatedAt: '2026-09-03'`. Arabic copy below is *draft* — a native reviewer finalizes it.

They are grouped, not ranked. The *phase* they belong to is at the end of each card.

---

### PILLAR A — Mosque Operations Studio
*From one CSV to every surface a mosque actually uses.*

#### A1. Khutbah Studio & Timer — استوديو الخطبة والمؤقت

**Why now / creative twist:** Roadmap's `Khutbah Planner & Timer` is already the most honest first Islamic tool — it helps without issuing a ruling or touching Quran text. Twist: make it feel like a writer's studio, not a form. Waqf has no competing clone; Built-in Saudi has no equivalent at all.

**User job:** A khatib wants a calm, bilingual outline that respects 18–25 min, cites Quran 4:11 properly, times itself truthfully, and prints as a one-pager the assistant can hold.

**MVP:**
- Distraction-light outline editor with user-defined sections (optionally `first khutbah / jalsa / second khutbah`), word count → duration heuristic, rehearsal timer with laps and monotonic elapsed time (so tab pauses don't drift).
- Source list: *user-supplied* citations in v1 (Quran/Hadith/book/URL). A later integration can *pick* a verified passage from D1/D2's reviewed stores.
- Speaker mode: huge type, elapsed/remaining, optional Wake Lock.
- Export: print one-pager, Markdown, plain text, local JSON (versioned schema, migratable).
- Boundaries: never AI-generates khutbah text, rulings, or translations; never prescribes a school's structure without a cited source; never transmits drafts.

**Processing and privacy:** `browser` — `"Drafts stay in your browser. Nothing is sent anywhere. Optional device-only autosave is off by default and has a visible Clear."`

**Methodology & risk:** Low–medium. Product design, not `fiqh` engine. Gate is bilingual RTL + timer fidelity + print QA, not a fatwa review. Dataset gate only if D1/D2 integration later.

**Effort:** S–M · **Phase: 1** — first build. Proves the local-JSON + print + timer patterns for everything else.

#### A2. Mosque Publisher — ناشر المسجد

**Why now / creative twist:** Merges roadmap's `Mosque Prayer Timetable Builder` + `Ramadan Timetable Generator` + Built-in Saudi's printable timetable — but as a *publisher* that turns one CSV into four surfaces (A3/A4 print, lobby TV 16:9, mosque WhatsApp PNG, and an `.ics` subscription). Built-in Saudi prints one Saudi-city month from its calculator; this formats *any* mosque's *own* times, in Arabic/English/bilingual, with its logo/QR.

**User job:** The imam's Excel has Ramadan's Fajr/Maghrib/Isha for 30 days — turn it into a framed A3, a looping TV slide, and a subscription the congregation can actually follow.

**MVP — supplied-times mode (v1 does NOT calculate):**
- Import: manual table or CSV paste (date, Fajr adhan/iqamah, …, Jumu'a), with per-row validation (ordering, duplicate/missing dates, 29/30-day Ramadan without assuming 30).
- Design: mosque name/location/logo, contact, notes, Hijri date column (typed as *supplied* or *variant-qualified*), color, RTL-correct tables, "Times supplied by [mosque] — generated 2026-09-03" footer that *never* drops from any export.
- Separate fields for *adhan* vs *iqamah* vs *Jumu'a* (confusing them breaks congregations).
- Export: print HTML/PDF (A3/A4), PNG, 16:9 slide, CSV, `.ics` (separate VEVENTs for iqamah where useful).

**Later calculated-draft mode:** Reuses the single reviewed Prayer Times engine from §6.1; calculated cells stay visually distinct from overrides and the export carries `method + Asr + high-lat + adjustments + timezone + "check local announcements."`

**Processing:** `browser` — `"Timetable and logo are read and rendered locally. No file is uploaded."`

**Methodology & risk:** Low in supplied mode (that's the point — formatting, not calculating). Risk is users mistaking a publisher's output for a calculated ruling — mitigated by the mandatory attribution line.

**Effort:** M–L · **Phase: 1** — shares print/ICS pipeline with A1/Cs.

#### A3. Qibla Row Aligner — محاذاة صفوف الصلاة

**Why now / creative twist:** Every qibla tool answers "which direction?" — almost none answers "how do I lay *straight rows perpendicular to it* in *this* room?" — the actual job for office musallas and pop-up Eid halls. Pairs with `qibla-finder` (bearing in) → floor plan out. Delightfully physical, printable, and trivially honest.

**User job:** Room is 5 m × 4 m, qibla is 123° from true north — print me a 1:50 floor guide with row lines, imam dot, and tape-measure labels I can lay with floor tape.

**MVP:**
- Inputs: room length/width (m), qibla bearing (from `qibla-finder` or manual), row spacing (default 1.2 m), imam position.
- Output: scaled SVG floor plan, rows ⟂ qibla, imam marker, PDF at 1:50/1:25 with ar/en labels + cutting guides.
- No compass/camera capture — user supplies the bearing (keeps it pure geometry + print; avoids DeviceOrientation permission hell from §6.2).
- Export retains `bearing: 123.4°, method: … , "Verify with a trusted reference — this plan assumes the bearing you entered."`

**Processing:** `browser`

**Methodology & risk:** Low — Euclidean geometry. Must state bearing is from **true north** (not magnetic) and that declination is not applied to the room.

**Effort:** S–M · **Phase: 2** — cheap win once `qibla-finder` ships.

---

### PILLAR B — Personal Worship Continuity
*Private trackers that forgive, not shame.*

#### B1. Qada Companion — رفيق القضاء

**Why now / creative twist:** The #1 requested Islamic feature across the App Store "26 calculators" (`Qada Salah` + `Qada Sawm`), CalcTypes and Falah — and completely absent from Built-in Saudi. Twist: not a one-off number, but a *companion* that counts days × prayers and turns them into a forgiving daily plan ("after Fajr: 1 qada Fajr"), with a 30-day checkbox grid you actually want to keep.

**User job:** "I have 2 years from illness/jahiliyya — tell me how many, spread them over 6 months at 1 extra per fard per day, and let me mark them quietly on my device."

**MVP:**
- Inputs: date range *or* raw count, witr count toggle, daily capacity (e.g. 1 extra per fard), madhhab note for display (Hanafi/Shafi'i witr difference shown, not enforced).
- Engine: `days × (2+4+4+3+4) = fards` + witr/sawm; distributes across Gregorian + Hijri display (reuses `hijri-converter` tables optionally).
- Plan: suggests "after Zhuhr: 1 qada Zhuhr + 1 qada Asr", never auto-marks as done; missed day rolls forward gently.
- Storage: React state by default; `localStorage` only after "Save on this device" + visible "Clear all". Worship history never leaves the browser.
- Export: 30-day checkbox PDF, CSV, JSON with generation timestamp — no shareable link that leaks counts.

**Processing:** `browser` — `"Missed counts and marks stay in your browser. Nothing is sent anywhere."`

**Methodology & risk:** Low–medium. Counting + scheduling, not taklif-dating. Must show witr assumption. Needs bilingual print QA.

**Effort:** M · **Phase: 1** — proves the private-vault pattern for B2/C2.

#### B2. Fidya & Kaffarah Console — منصة الفدية والكفارة

**Why now / creative twist:** Every Islamic hub ships a Fidya/Kaffarah calculator — because Ramadan realities (illness, pregnancy, broken fast, broken oath — Quran 5:89) demand it, and the correct answer is *options*, not one number. Built-in Saudi has nothing. Twist: show the three canonical options **side-by-side** every time, with school-labelled feeding rows, instead of silently picking Hanafi or Shafi'i.

**User job:** "I missed 12 fasts / broke a fast deliberately / broke an oath — what are my valid options and what does feeding cost *here*?"

**MVP:**
- Mode switch: `Fidya` (cannot make up) / `Kaffarah — broken Ramadan fast` / `Kaffarah — oath`.
- For each: triptych — `fast 60 consecutive days` / `feed 60 poor × 2 meals` / historic `free a slave` (annotated "no longer applicable") — per Bukhari 1936.
- Feeding line: user enters local cost per meal (currency); tool multiplies `meals = fasts × 60 × 2` etc. No live price fetch in v1 (keeps it `browser` + deterministic). Note that consecutiveness breaks on illness per madhhab.
- Output: table per mode with meals, total cost, consecutiveness rule, copyable JSON that retains `mode + mealPrice + madhhabLabels + warning: "Confirm with a qualified authority for your situation."`

**Processing:** `browser`

**Methodology & risk:** Medium. Hanafi cash-vs-food and consecutiveness are recognized differences — must be **configuration**, not a hidden default. Needs a short `METHODOLOGY.md`.

**Effort:** S–M · **Phase: 3** — after `hijri-converter` variant discipline is established.

#### B3. Tasbih Garden — حديقة التسبيح

**Why now / creative twist:** Every major app (MuslimPro 100M+, Pillars, Tarteel, Falah) features a tasbih — Built-in Saudi only puts a counter *inside* Adhkar. Twist: make practice *lovely* without being childish — each completed 33 plants something in an offline garden, streak without shaming, nothing uploaded, nothing preached. The simplest tool here should also be the most humane.

**User job:** "Give me a counter that works with the screen off, remembers my daily 33×3 + istighfar goal, never asks for an account, never uploads my dhikr."

**MVP:**
- Counter: huge tap target, spacebar, count + grand total, vibration toggle, works as PWA offline.
- Presets: 33 S/A/Ak, 34 Allahu Akbar, 100 Istighfar, custom phrase (user-typed in v1 — no bundled canonical text, so no licensing gate; a later curated library adds a dataset record).
- Goals: per-day target bar, garden tile fills per completed wird, streak is local and *never shames* (missed day → gentle roll-forward).
- Storage: local only, "Save on this device" + "Clear all".

**Processing:** `browser` — `"Counts are kept in your browser only."`

**Methodology & risk:** Very low. No bundled text in v1 = lowest shipping risk in this doc.

**Effort:** S · **Phase: 2** — instant "wow, it works offline" PWA.

#### B4. Sunnah Fasting Orbit — مدار الصيام المسنون

**Why now / creative twist:** Built-in Saudi's monthly Islamic calendar *shows* white days (13–15) with moon phase — useful but passive. Twist: turn that calendar into an *orbit* — the next 12 lunar orbits with white days, Mondays/Thursdays, ʿArafah/ʿAshura (+ Tasu'a) and the 6 of Shawwal as one `.ics` you subscribe to, plus printable orbit cards. Reuses the Hijri engine; adds motion.

**User job:** "Give me the next 12 months of Sunnah fasts for my timezone without doing Hijri math, and let me subscribe on my phone or print it for the fridge."

**MVP:**
- Inputs: IANA timezone, Hijri variant explicit (Umm al-Qura vs Civil), Gregorian start month.
- Engine: month lengths from the chosen variant's table (never 29.5), so white days are correct.
- Output: list of White Days (Hijri → Gregorian), Mondays/Thursdays, ʿArafah/ʿAshura (+ Tasu'a), optional 6 Shawwal block. Every cell carries variant badge.
- Export: one `.ics` feed (each event description: `variant + "calculated — may differ 1–2 days from local sighting"`), printable A4/PDF with Arabic numerals option, CSV.

**Processing:** `browser` — `"Dates are generated from the bundled table. Nothing is sent anywhere. The .ics is downloaded directly."`

**Methodology & risk:** Low–medium. Reuses already-reviewed Hijri tables; risk is users treating calculated white days as sighted — mitigated by persistent warning in UI + export + `.ics`.

**Effort:** M · **Phase: 2** — Hijri-dependent; builds on `hijri-converter`.

#### B5. Khatma Circle & Hifz Loop — حلقة الختمة وحلقة الحفظ

**Why now / creative twist:** Built-in Saudi's Khatma planner is solo (split N days by pages/juz). Twist: make it *collective* and *memorized*. **Khatma Circle** splits the 30 ajza (or 60 hizb / 604 pages) among a family/halqa and tracks the ring; **Hifz Loop** is the same ring for *murajaʿa* — spaced revision for what you already memorized, with weak-spot bias but no guilt. Both share one splitter + one printable system.

**User job (Circle):** "We are 7 people — split the Qur'an fairly this week and give each person a card." **(Loop):** "I memorized 5 ajza — give me a 30-day loop that revisits weak surahs more often."

**MVP:**
- Circle inputs: participants (2–60, named list optional), split basis (ajza / hizb / 604 pages — Madinah mapping stated), deadline, en/ar. Balanced partition (e.g. 30 ÷ 7 → 4×5, 3×4), deterministic and explained; optional "equalize pages" via 604 mapping.
- Loop inputs: memorized surahs/ajza, daily budget (15/30/60 min), rotation style (recent-first vs even). Daily batch (e.g. al-Baqarah + Juz 30 review), weekly overview with Hijri+Gregorian, local-only notes per batch ("mistakes at 2:255").
- Output: per-person assignment card (surah names + page ranges), collective progress ring, binder A5 inserts, JSON save/load (no account), single-link share via URL hash (no server). No AI-generated Qur'an text — names + ranges only in v1 (sidesteps Tanzil licensing until a pinned, checksummed dataset exists).

**Processing:** `browser` — `"All splitting and marks stay in your browser."`

**Methodology & risk:** Low. No obligation calculated; purely combinatorial. Must state page mapping is Madinah 604 and hizb/juz boundaries are conventional.

**Effort:** M · **Phase: 2** — reuses print pipeline.

---

### PILLAR C — Family Lifecycle Vault
*Marriage, birth, worship, departure — handled privately and clearly.*

#### C1. Mahr Vault — خزانة المهر

**Why now / creative twist:** Every Islamic directory lists a Mahr calculator (CalcaTools, NovaCalculator, UmmahKingdom), and none do it both *honestly* and *usefully*: they either hard-code a minimum or pretend mahr is just one number. Twist: make mahr a **vault record** — total ↔ muqaddam/mu'akhar split, gold grams (with karat) ↔ cash via today's price, bilingual one-pager to *attach* to a nikah — not a contract, but a clear record.

**User job:** "We agreed 50g gold — split it 30g now / 20g deferred, show cash value today, and give us a page to attach to the nikah file."

**MVP:**
- Inputs: total mahr as gold g (with karat), silver g, or cash (currency); muqaddam/mu'akhar split (% or cash); price per gram (user-entered in v1 — no live fetch, keeps it `browser`).
- Engine: `value = grams × purity × price/g`; `muqaddam + mu'akhar = total`; `decimal.js` precision.
- Output: bilingual one-pager (total / muqaddam / mu'akhar in weight + cash, price + date, kit note: "Mu'akhar is a debt on the husband, due on divorce or death; consult scholar + local civil requirements"), PDF + JSON.
- No signature/witness fields — those belong to the officiant's paperwork (prevents the PDF being mistaken for an executed contract).

**Processing:** `browser`

**Methodology & risk:** Low–medium. Quran 4:4 + Bukhari 5149; Hanafi 10-dirham vs Maliki/Shafi'i no-minimum is a labelled note, not a default.

**Effort:** S–M · **Phase: 2**

#### C2. Iddah Companion — رفيقة العدة

**Why now / creative twist:** The most pastoral, most Googled *women's* Islamic tool — and absent from Built-in Saudi (which only converts dates). Twist: not a date field that blurts a number, but a **private companion** — dates + a discreet daily journal + Hijri/Gregorian countdown that stays on-device, with rule-labelled output and a clear "confirm with a qualified authority, especially for quru."

**User job:** "Divorce pronounced 2026-07-10 / husband passed 2026-07-10 — when does my wait end, and can I keep these days privately?"

**MVP:**
- Trigger: `divorce (rajʿi/bāʾin)`, `khulʿ`, `husband's death`, `annulment`; for divorce with menses: `3 quru` (user confirms cycle length or uses lunar-month fallback, tool states the assumption); non-menstruating/menopause: `3 lunar months`; widow: `4 months + 10 days` (Quran 2:234).
- Inputs: event date in either calendar, Hijri variant explicit (Umm al-Qura / Civil), time-of-day note ("day starts at sunset vs civil midnight").
- Output: end date in both calendars with variant badge + rule label ("Widow — 4 months 10 days per 2:234"), "earliest remarriage = day after," discreet countdown card. Optional journal entries (local only).
- Export: JSON/PDF retains `rule + variant + warning`.

**Processing:** `browser` — dates computed from the bundled table; no date sent anywhere.

**Methodology & risk:** **High sensitivity, low math.** `Quru` interpretation varies by school — must be *choices*, never an autodecision. Needs domain review before `experimental`; v1 ships as **selectable-rule explainer**.

**Effort:** M · **Phase: 1** — tiny codebase, enormous women's need; front-load review.

#### C3. Fitrana Express — قطار الفطرة + Qurbani Collective — جماعة الأضحية

**Why now / creative twist:** Put Ramadan's last-night panic and Dhu al-Hijjah's cow-share coordination together — both are seasonal, household-scale, and need a *share sheet* you can paste into a family mosque WhatsApp. Built-in Saudi has Zakat but neither. Twist: Fitrana per *person* (not household wealth) with staple-aware math; Qurbani as a **collective** (1 cow/camel = 7 shares) with cost split and thirds suggestion.

**User job (Fitrana):** "5 people, wheat vs dates, cash value here — what do we owe tonight before Eid prayer?" **(Qurbani):** "A cow is 7 — we are 6 families — who pays what, how do we share the meat?"

**MVP — Fitrana:**
- Inputs: household n, staple (wheat/barley/dates/raisins), weight per person (1 saʿ ≈ 2.5–3.0 kg selectable, shown), cash price per kg (user-entered).
- Output: `total = n × kg × price`, with staple + assumption + price-date + "before Eid prayer" deadline; per-row family table + mosque-ready PDF.

**MVP — Qurbani Collective:**
- Inputs: animal (sheep/goat = 1; cow/camel = up to 7), total cost (user-entered), participants (1–7, names optional), distribution preference (keep 1/3 / gift 1/3 / charity 1/3 vs all charity — shown as suggestion, not ruling).
- Engine: `cost/share = total / shares`; meat weight intentionally *not* auto-estimated (varies too much).
- Output: per-family share card, printable share sheet, total + per-share JSON.

**Processing:** `browser` for both

**Methodology & risk:** Low. Only the saʿ→kg conversion (Fitrana) is variant; Qurbani avoids weight claims entirely.

**Effort:** S each · **Phase: 1** (Fitrana) → **Phase: 2** (Qurbani). Ship Fitrana two weeks pre-Ramadan.

#### C4. Aqeeqah Welcome Pack — حزمة العقيقة

**Why now / creative twist:** App Store lists Aqeeqah beside Qurbani/Nikah; every birth triggers the same 48-hour question (day-7, 2 sheep for a boy / 1 for a girl, naming, head shave). Built-in Saudi answers none of it. Twist: a *welcome pack* — dated checklist + ICS reminder + optional silver-weight charity — all Hijri-aware.

**User job:** "Boy on 2026-08-01 — when is day-7, what do we actually do, and what will it cost?"

**MVP:**
- Inputs: birth date (either calendar, variant explicit), sex (2 vs 1 — Sunnah note cited), optional head-hair silver weight.
- Engine: adds 7 days (states "day of birth = day 0 vs day 1" assumption), shows Gregorian/Hijri sacrifice + naming + halq dates.
- Output: checklist (aqeeqah / tasmiyah / halq + hair-weight charity in silver), cost helper (sheep price ×1 or ×2, user-entered), printable card + ICS for day-7.

**Processing:** `browser`

**Methodology & risk:** Low–medium. 2-vs-1 and day-counting conventions vary — tool must show the assumption and cite without issuing a ruling.

**Effort:** S · **Phase: 2**

#### C5. Wasiyyah & Inheritance Atelier — مرسم الوصية والمواريث

**Why now / creative twist:** The single most-requested Islamic tool (CalcTypes "most-used" #2, every FaraidHub/ShariaWiz/IslamicFinanceCalculator page) — and the riskiest. Roadmap (§5) demands a 4-stage ladder: reference explorer → golden-corpus demonstrator → restricted calculator → broader engine only after a dedicated *faraʾid* review group owns a regression corpus. Twist: make that ladder *visible* in the product — an **atelier** where you first *see* how faraid works (verses + trace), then — only for safe families — get an **education-mode** share sheet that stops rather than guessing, plus a **Wasiyyah Studio** that validates the 1/3 cap and heir-exclusion.

**User job:** "Show me how faraid works for wife + 2 daughters + mother — with each share's Quran verse — and tell me to see a scholar for my actual estate. Then let me earmark 10% to a mosque within the 1/3."

**MVP — Inheritance Explorer (Edu):**
- Inputs: *only* spouse, children (sons/daughters), parents, single grandmother — the 5 patterns that cover ~80% of learning queries without hitting akdariyyah/musharakah/grandfather traps.
- Engine: exact rational arithmetic (fractions, not floats), priority `debts → wasiyyah ≤1/3 → furud (1/2…1/6) → asabah → awl/radd/hajb`. For any *unsupported* combination (grandfather + siblings, maternal/paternal siblings, missing heirs, simultaneous death), the tool **stops**: "This pattern requires a qualified scholar — calculation not shown" + why (e.g. al-ghurrawayn).
- Output: family-tree card with each heir's share as fraction + % + Quran citation (tap → verse), plus a 5-line rule trace (Hajb → Furud → Asabah → Awl/Radd). Export retains `school + version + "Educational illustration — not a distribution"` banner in PDF + JSON.

**MVP — Wasiyyah Studio (1/3):**
- Inputs: net estate (user-entered — tool does *not* compute debts/taxes), heir list (from Explorer's limited set or pasted), non-heir bequests (% or cash).
- Validation: `sum(bequests) ≤ 1/3` and `no bequest names a Quranic heir` unless user ticks "ratified by heirs after death — show warning anyway." On fail: blocks export and explains the exact rule (Sa'd b. Abi Waqqas).
- Output: bilingual one-page summary — bequests table + faraid base (= 2/3 or more) + "Take this to your scholar & lawyer — not a legal will" banner.

**Processing:** `browser` — family + estate value never leave the device, never persisted by default.

**Methodology & risk:** **Very high.** Implement the roadmap's 4 stages; use `decimal.js`/rational; build a scholar-approved golden corpus *before* `available`; block, don't improvise. This is a year-long commitment, not a sprint feature.

**Effort:** L — but the *restricted Edu slice* is M–L. · **Phase: 4** — only after a standing review group commits.

---

### PILLAR D — Knowledge & Wealth Purity
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

## 7. Delivery — one realistic sequence

### Phase 0 — governance before more promises

1. Appoint named reviewers for prayer/qibla/calendar, Quran/Hadith, Zakat/wealth, and faraid.
2. Adopt a dataset record format: `source, version, license, checksum, corrections URL, last review date` (for Quran/Hadith/gold-price/stellar tables if ever live).
3. Define the standard `method / source / limitations` block reused on tool pages and in every export.
4. Agree what `experimental` means for religious tools: *runnable, documented, but not yet approved for reliance* — not just a roadmap page.

### Phase 1 — private, printable, browser-only companions (the quick wins that earn trust)

1. **A1 Khutbah Studio** — establishes editor + print + local-JSON patterns.
2. **A2 Mosque Publisher** (supplied-times mode) + **C3 Fitrana Express** — seasonal; prove CSV → print/ICS.
3. **B1 Qada Companion** + **C2 Iddah Companion** (selectable-rule explainer) — prove the privacy-vault pattern.

These ships require no calculation engine and give mosques and families something to pin to a wall *this* month.

### Phase 2 — reference + geometry + orbit (variant discipline)

4. **D1 Quran Card Atelier** (after dataset/licensing/font review)
5. **6.2 Qibla Finder** (static true-north bearing completion)
6. **6.3 Hijri Converter** (explicit variants completion)
7. **B4 Sunnah Fasting Orbit** + **B5 Khatma Circle & Hifz Loop** + **B3 Tasbih Garden** — reuse Hijri + print pipelines
8. **C1 Mahr Vault** + **C4 Aqeeqah Welcome Pack** + **A3 Qibla Row Aligner**

### Phase 3 — the sensitive arithmetic (methodology-gated)

9. **6.1 Prayer Times Calculator** (engine review) → add calculated-draft mode to A2 *only by reusing that engine*.
10. **B2 Fidya & Kaffarah Console**
11. **D4 Wudu & Salah Cards**
12. **D3 Halal Purification Ledger** (worksheet — no stock database)

### Phase 4 — specialist programs (not ordinary features)

13. **D2 Hadith Lens** — after licensing spike.
14. **C5 Wasiyyah & Inheritance Atelier** — after **6.4 Zakat**'s methodology discipline is proven. Faraid starts as **reference explorer → demonstrator → restricted Edu (5 heir types, stop-on-edge) → broader engine** only once a *standing* faraid review group owns the golden corpus and regression suite.

---

## 8. Definition of done for every Islamic tool

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

## 9. Source shortlist for methodology work

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
