# Islamic Web Tools — Product and Technical Roadmap

Status: product analysis, not an implementation commitment  
Last reviewed: 2026-08-30

## Purpose

This document evaluates ten tools whose core use is specifically Islamic, not
merely a general utility marketed to Muslims. It translates each idea into a
small web workflow that can follow Waqf Toolkit's rules:

- open in a browser with no installation or required account;
- work in English and natural Arabic with full RTL support;
- state whether processing happens in the browser, on our server, or through
  a named third-party API;
- expose methodology, sources, assumptions, and legitimate differences;
- remain `planned` or `experimental` until it works end-to-end;
- never present software output as a fatwa or substitute for qualified advice.

This is a direction document. Adding any of these tools to the product still
requires a catalog entry, English and Arabic copy, sitemap entries, a public
roadmap issue, tests, and—where marked—a completed `METHODOLOGY.md` based on
[`docs/templates/calculation-methodology.md`](templates/calculation-methodology.md).

## Portfolio recommendation

| Tool | Islamic specificity | Religious/data risk | Coarse effort | Recommendation |
|---|---:|---:|---:|---|
| Khutbah Planner & Timer | High | Low–medium | S–M | Build first |
| Mosque Prayer Timetable Builder | High | Medium | M | Build first; user-supplied times |
| Ramadan Timetable Generator | High | Medium | M | Build as a mode of the timetable builder |
| Quran Citation & Sharing Tool | High | High | M | Build after source/licensing review |
| Qibla Finder | High | High | M | Build static bearing first |
| Prayer Times Calculator | High | High | L | Continue existing planned tool after methodology review |
| Hijri–Gregorian Converter | High | High | M | Build only with explicit calendar variants |
| Zakat Calculator | High | Very high | L | Scholar-led design before implementation |
| Hadith Reference Finder | High | Very high | L | Data-source and licensing spike first |
| Islamic Inheritance Calculator | High | Critical | XL | Do not build without a dedicated fara'id review group |

Effort estimates include bilingual UI, domain documentation, unit tests, route
integration, and responsive browser testing. They are directional rather than
delivery estimates.

## Shared product rules

### 1. Every result must explain itself

Calculation and content tools must show the active method or source beside the
result, not hide it in an about page. A share or export must retain enough
metadata to identify the method, dataset version, adjustments, and date of
generation.

### 2. Recognized differences are configuration, not bugs

Prayer calculation methods, Asr conventions, high-latitude rules, Hijri
calendar variants, Zakat treatments, and inheritance schools cannot be reduced
to an undocumented global default. If two recognized authorities can produce
different results, the choice belongs in the methodology and, where useful, in
the interface.

### 3. Prefer deterministic browser processing

Bundled, versioned algorithms and datasets are preferable when their licenses
allow redistribution. They make results reproducible and prevent sensitive
inputs from leaving the device. Runtime APIs are acceptable only when their
provider, transmitted data, retention implications, credentials, terms, and
failure states are disclosed before use.

### 4. Religious content is immutable source material

Canonical Quran or Hadith text must never pass through automatic translation,
rewriting, summarization, spell correction, or generative AI. UI formatting may
change presentation, but stored source strings and citations must remain
verbatim and traceable to a named version.

### 5. Uncertainty must survive export

Warnings such as “calculated estimate,” “user-supplied timetable,” “calendar
variant,” or “grading supplied by the source” must not disappear when a result
is copied, printed, downloaded, or shared.

---

## 1. Prayer Times Calculator

### User job

Calculate Fajr, sunrise, Dhuhr, Asr, Maghrib, and Isha for a chosen location and
date while making the calculation convention visible and adjustable.

This already exists in the catalog as the planned Prayer Times Widget. It
should remain one tool rather than creating a second prayer-times entry.

### Recommended MVP

- Accept manual latitude/longitude as the privacy-preserving default.
- Offer device geolocation only after a clear user action and permission prompt.
- Require a Gregorian date and an IANA timezone; never infer timezone from
  longitude alone.
- Let the user select a named calculation method or custom Fajr/Isha parameters.
- Expose the Asr convention, high-latitude rule, polar-circle behavior,
  rounding rule, and manual minute adjustments.
- Display the six calculated times, active method, coordinates rounded for
  display, timezone, and all adjustments.
- Allow copying or downloading a small JSON/CSV record containing the result
  and methodology metadata.

### Explicitly outside the MVP

- Adhan audio, notifications, background alarms, or account-based schedules.
- Automatic mosque selection or claims that the result matches a local mosque.
- Hidden regional defaults based solely on IP address.
- Iqamah times; those are supplied by individual mosques rather than derived
  from the astronomical prayer calculation.

### Methodology and source requirements

The calculation document must name the astronomical algorithm and every prayer
convention. A candidate implementation reference is the open-source
[`adhan-js`](https://github.com/batoulapps/adhan-js) parameter model, which
explicitly represents Fajr/Isha angles, Asr madhab, high-latitude rules,
polar-circle resolution, rounding, and adjustments. Its constants must still be
checked against the current publications of the institutions whose names are
shown in the UI; a library name is not sufficient religious validation.

The method catalogue may use [PrayTimes' documented method table](https://praytimes.org/docs/methods)
as an implementation cross-check, but each shipped preset needs a named,
versioned source and domain-review approval. Test reference values should come
from reviewed institutional timetables for several locations and seasons, not
from another app using the same library.

### Processing and privacy

`processing: 'browser'`. Coordinates, date, and settings stay in memory unless
the user deliberately saves an export. The browser's Geolocation API requires
HTTPS and explicit permission; manual coordinates must always remain available
([MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)).

### Implementation shape

- `src/tools/prayer-times/engine.ts`: pure calculation boundary.
- `src/tools/prayer-times/methods.ts`: reviewed, versioned preset data.
- `src/tools/prayer-times/prayer-times-try.tsx`: localized interface.
- `src/tools/prayer-times/METHODOLOGY.md`: completed required template.
- Use integer epoch milliseconds internally and format only at the UI boundary.
- Keep timezone handling separate from solar calculations.

### Verification gates

- Reference cases across Riyadh, Makkah, London, Oslo, New York, Jakarta, and
  southern-hemisphere locations.
- Dates around daylight-saving transitions and year boundaries.
- Both Asr conventions and every supported high-latitude rule.
- Polar day/night behavior must return an explicit unresolved or adjusted state,
  never `NaN`, an invented time, or a silent fallback.
- English/Arabic output and RTL layout.

### Recommendation

High value, but not a quick win. Proceed only after the methodology document
and reference-test set have been approved by a domain-knowledgeable reviewer.

---

## 2. Qibla Finder

### User job

Given a location, show the initial true-north bearing of the geodesic toward the
Kaaba and explain how to use that bearing without overstating phone-compass
accuracy.

### Recommended MVP

- Accept manual coordinates and optional permission-based geolocation.
- Display the numerical bearing clockwise from true north.
- Show a static compass dial that can be aligned with a reliable physical or
  map-based true-north reference.
- Show the chosen Kaaba reference coordinate and calculation model in a details
  panel.
- Provide a copyable result including coordinates, bearing, model, and timestamp.

### Live-compass phase

Phone orientation should be a later experimental enhancement, not the core
promise. Absolute-orientation permission has limited browser availability and
magnetometers are sensitive to calibration, cases, nearby metal, and local
magnetic conditions. The live view must display a calibration warning and fall
back to the numerical true-north bearing. MDN currently marks absolute
orientation permission as limited availability
([DeviceOrientationEvent permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static)).

### Methodology and source requirements

- Choose and cite one reviewed Kaaba reference coordinate. Store it as a named,
  versioned constant rather than scattering latitude/longitude literals.
- State whether the calculation uses a sphere or the WGS84 reference ellipsoid.
- Prefer a robust inverse-geodesic implementation such as
  [`geographiclib-geodesic`](https://github.com/geographiclib/geographiclib-js),
  whose inverse result supplies the initial azimuth clockwise from north.
- Document the religious/geometric interpretation of “direction” and have it
  reviewed; the software must not silently settle a jurisprudential question.
- Clarify that the returned angle is relative to true north, not magnetic north.

### Processing and privacy

`processing: 'browser'`. No map tile, geocoding, or network call is needed for
the MVP. Coordinates are not stored. Location permission is requested only when
the user selects “Use my location.”

### Edge cases and tests

- At or extremely near the Kaaba: report that direction is undefined/irrelevant
  instead of drawing a random arrow.
- Near-antipodal points: ensure the geodesic library returns a stable result or
  report ambiguity explicitly.
- Poles and invalid coordinates.
- Reviewed reference bearings from several continents.
- Orientation unsupported, denied, or low-confidence.

### Recommendation

Build the static true-north bearing tool first. Treat a rotating phone compass
as optional experimental UI with aggressive capability detection.

---

## 3. Hijri–Gregorian Date Converter

### User job

Convert a date between Gregorian and a specifically named Hijri calendar
variant, while explaining why local moon-sighting dates may differ.

### Recommended MVP

- Bidirectional Gregorian ↔ Hijri conversion.
- Support two explicit variants initially:
  - Umm al-Qura;
  - tabular civil calendar.
- Show the selected variant directly in the result and copied text.
- Display a permanent warning that calculated calendars may not match a local or
  national moon-sighting announcement.
- Offer Arabic/Latin digits as formatting choices without changing the date.

### Methodology and source requirements

Do not expose a method simply called “Islamic calendar.” Unicode CLDR
distinguishes `islamic-umalqura`, `islamic-civil`, `islamic-tbla`, and regional
sighting variants because they are not interchangeable
([Unicode calendar option names](https://cldr.unicode.org/translation/displaynames/locale-option-names-key)).

Browser `Intl` support is useful for localized formatting, but it should not be
the sole conversion engine unless its supported range, fallback, and
cross-browser reproducibility are verified. Current platform documentation notes
that Umm al-Qura data has a defined range and may fall back outside that range
([MDN supported calendar values](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf)).

Prefer a bundled, versioned dataset or deterministic algorithm whose license and
valid range are documented. The methodology must identify epoch choice, leap
year scheme, valid date range, and behavior outside that range.

### Processing and privacy

`processing: 'browser'`. A date is not sent anywhere. No location is required
unless a future sighting-based mode is introduced.

### Tests

- Known conversion pairs approved against the chosen dataset.
- First and last supported dates.
- Month and year boundaries, leap years, and reverse-conversion round trips.
- Explicit failure outside the supported range.
- Results must be identical under English and Arabic UI locales apart from
  presentation and digit style.

### Recommendation

Useful and feasible after the team chooses exactly which calendar variants it
is willing to support. Never market calculated output as observed moon sighting.

---

## 4. Zakat Calculator

### User job

Help a user organize eligible assets and produce a transparent Zakat estimate
under a clearly selected methodology.

### Recommended first scope

Limit version one to a personal monetary-assets worksheet:

- cash and bank balances;
- gold and silver by weight and purity;
- readily realizable investments entered by the user;
- money owed to the user;
- eligible short-term liabilities, only if included by the selected methodology;
- manual gold/silver price and currency;
- confirmation that the relevant holding period has been met.

Output an itemized worksheet: included assets, exclusions, deductions, selected
nisab basis, nisab value, zakatable base, rate, estimate, methodology version,
and unresolved questions.

### Explicitly outside the first scope

- Agricultural produce, livestock, minerals, business inventory, pensions,
  trusts, multiple currencies with live exchange rates, or jurisdiction-specific
  tax treatment.
- Automatically fetching metal prices. Manual entry keeps the first version
  deterministic and avoids silently depending on a market-data provider.
- A single unexplained default for gold versus silver nisab.
- Statements that Zakat is definitively due or that the result is a ruling.

### Methodology and source requirements

This tool needs scholar-led product design before code. A candidate standards
baseline is [AAOIFI Shari'ah Standard No. 35 on Zakah](https://aaoifi.com/download/24233/),
but applicability to an individual consumer calculator, recognized differences,
and regional expectations must be reviewed explicitly. The methodology must
cover at least:

- asset categories and valuation date;
- gold/silver nisab weights and which basis is selected;
- lunar versus solar holding period and rate;
- treatment of personal jewelry, receivables, debts, investments, and mixed-use
  assets;
- rounding and currency precision;
- which cases the tool refuses to decide.

### Processing and privacy

`processing: 'browser'`. Financial values stay in memory. Do not persist them to
localStorage by default. Allow an explicit local JSON/PDF export with a warning
that the file contains sensitive financial information.

### Implementation and tests

- Use decimal or rational arithmetic, never binary floating-point for money.
- Keep method rules as reviewed data/configuration rather than UI conditionals.
- Provide a full calculation trace for every included/excluded amount.
- Test exact boundary values below, at, and above nisab.
- Test multiple currencies, weights, purity conversion, negative/invalid input,
  and zero-liability cases.
- Build a scholar-approved scenario corpus before setting `available`.

### Recommendation

Do not begin with UI implementation. First appoint a domain reviewer, select the
supported methodology and exclusions, and produce approved reference scenarios.

---

## 5. Islamic Inheritance Calculator

### User job

Explain how an estate might be divided among entered heirs under a named school
and reviewed rule set, with every inclusion, exclusion, and share traceable.

### Risk assessment

This is the highest-risk proposal. The primary Quranic shares in An-Nisa
4:11, 4:12, and 4:176 are foundational, but a working calculator also needs a
large body of rules covering fixed-share heirs, residuaries, exclusion,
grandparents, sibling classes, `awl`, `radd`, special cases, and school-specific
differences. It can also interact with civil law, wills, debts, jointly owned
property, and disputed family facts.

Primary entry references include
[`4:11`](https://quran.com/4/11),
[`4:12`](https://quran.com/4/12), and
[`4:176`](https://quran.com/4/176), but these verses alone are not a complete
software specification.

### Safe product sequence

1. **Reference explorer:** reviewed descriptions of heir categories and cited
   source material; no personalized result.
2. **Scenario demonstrator:** a finite set of scholar-approved examples with
   exact rational shares.
3. **Restricted calculator:** only scenarios proven by the reference corpus;
   unsupported combinations stop and request qualified review.
4. **Broader engine:** only after sustained review across the selected school or
   schools.

### Required inputs and outputs

Inputs must separate gross estate, funeral expenses, debts, valid bequests, and
net distributable estate before heir selection. Heirs must be represented by
precise relationships, counts, sex where the rule requires it, and survival at
the relevant time.

Output should prioritize exact fractions and a rule trace before currency
amounts. It must list blocked heirs and why, unresolved facts, selected school,
methodology version, and a strong professional-review notice.

### Explicit exclusions for any early version

Disputed lineage, unborn or missing heirs, simultaneous deaths, intersex cases,
slavery-era categories, homicide/disqualification questions, adoption/civil-law
claims, complex gifts, family businesses, and jurisdiction-specific probate.
The software must stop rather than improvise.

### Processing and implementation

`processing: 'browser'`; estate and family information is highly sensitive and
must not be persisted by default. Use exact rational arithmetic and a typed rule
engine that emits both a result and a machine-readable explanation trace. Avoid
a web of component-level conditionals.

### Verification gates

- A large, scholar-approved golden corpus with citations for every scenario.
- Invariants: shares never negative; blocked heirs receive zero; totals and
  adjustments are exact; all remainder handling is explained.
- Mutation/property tests across heir combinations, followed by human review of
  every newly reachable state.
- Independent review by more than one specialist in `ilm al-fara'id` and legal
  review of the user-facing disclaimer in target jurisdictions.

### Recommendation

Do not place this on the near-term roadmap. Start only when a dedicated domain
review group agrees to own the methodology and regression corpus over time.

---

## 6. Ramadan Timetable Generator

### User job

Turn reviewed daily Ramadan times and community information into a clear Arabic,
English, or bilingual timetable for print and sharing.

### Recommended MVP: supplied-times mode

- Let a mosque or organizer enter or paste daily dates, Fajr, Maghrib, and any
  locally chosen labels such as suhoor cutoff, iftar, or Taraweeh.
- Support CSV import with a preview and per-row validation.
- Add mosque name, location, contact details, notes, and logo.
- Export accessible HTML/print, PDF, PNG, and CSV.
- Mark the output “Times supplied by [name]” with generation date.
- Preserve the distinction between Fajr and any separately supplied imsak or
  suhoor cutoff; never silently treat them as identical.

This mode formats information but does not calculate religious times. That
makes it a much safer first release.

### Later calculated-times mode

Reuse the reviewed Prayer Times engine rather than creating a second
calculation implementation. The export must include calculation method, Asr
convention, high-latitude rule, adjustments, timezone, and a direction to check
local mosque announcements.

### Processing and privacy

`processing: 'browser'`. Files and branding assets are read locally. Generated
exports are downloaded directly. No account or hosted timetable is required.

### Tests

- CSV parsing, rejected rows, duplicate/missing dates, and time ordering.
- Full Ramadan lengths of 29 and 30 days without assuming which will occur.
- Gregorian/Hijri display labels treated as supplied or method-qualified data.
- Arabic shaping, RTL table order, print pagination, and small-screen preview.
- Export contains source/method notices and never drops them.

### Recommendation

High-priority Islamic tool. Implement it as a Ramadan template within the
Mosque Prayer Timetable Builder described below, sharing one timetable model and
export pipeline.

---

## 7. Quran Citation & Sharing Tool

### User job

Select a Quran passage by surah and ayah, verify it, and copy or export a clean,
accurately cited Arabic/translation presentation without retyping sacred text.

### Recommended MVP

- Select surah and one ayah or a contiguous ayah range.
- Show immutable Uthmani Arabic from one named dataset.
- Optionally include one or more separately attributed, licensed translations.
- Copy as plain text, Markdown, or a restrained image card.
- Include surah name, surah number, ayah range, translation name, dataset
  version, and attribution.
- Provide a one-click route back to the source passage for verification.

### Content sourcing options

**Bundled browser-first option:** Tanzil provides a downloadable, verified Quran
text under CC BY 3.0 with special terms: attribution is required and the text
may be redistributed verbatim but not changed
([Tanzil download](https://tanzil.net/docs/download),
[Tanzil text license](https://tanzil.ca/docs/text_license)). Pin a reviewed
version and checksum it in tests.

**API option:** Quran Foundation exposes Quran content and official SDKs, but its
content APIs use application credentials from a backend and are therefore a
server/cloud integration, not browser-only
([Quran Foundation API reference](https://api-docs.quran.com/docs/api-reference/)).
Provider terms and the exact transmitted request must be disclosed.

Translation licenses must be evaluated individually; an Arabic-text license
does not grant rights to every translation.

### Integrity requirements

- Store canonical source strings separately from display formatting.
- Never run browser translation, spellcheck, normalization, typography cleanup,
  AI rewriting, or truncation over Quran text.
- Block a card export rather than splitting or clipping an ayah invisibly.
- Keep Arabic and translation visually distinguishable and separately
  attributed.
- Use a source/version checksum and exact fixture comparisons in CI.

Quran Foundation specifically warns against automatic translation of returned
Quran content because it can distort meaning
([developer FAQ](https://api-docs.quran.com/docs/tutorials/faq/)).

### Processing and privacy

Bundled dataset: `processing: 'browser'`. Quran Foundation API:
`processing: 'cloud-api'`, provider `Quran Foundation`, called only through the
project's server proxy. Passage selection is normally not sensitive, but the
disclosure rule still applies.

### Recommendation

Strong fit for the toolkit and achievable after dataset, translation licensing,
font rendering, and domain review are settled. Begin with reference-based
selection, not semantic search or AI-generated commentary.

---

## 8. Hadith Reference Finder

### User job

Find a hadith in a clearly identified, licensed collection and produce a
complete citation that preserves source, numbering, language, and the grading
supplied by the dataset.

### Recommended MVP

- Select a supported collection, book, and reference number.
- Search exact words within a limited curated dataset.
- Display Arabic text, licensed translation, narrator, collection/book,
  reference numbering, and source-supplied grading where available.
- Copy a citation that retains all provenance.
- Link to the source record and show dataset version/date.

### What the MVP must not do

- Claim that all displayed reports have one universally accepted grading.
- Merge numbering systems without mapping metadata.
- Generate a grading, explanation, translation, or authenticity judgment with AI.
- Offer semantic “find a hadith that proves…” answers without a reviewed
  retrieval and presentation policy.
- Scrape websites whose licenses or terms do not allow redistribution.

### Data-source spike

Before UI work, compare candidate sources on collection coverage, Arabic text,
translations, grading provenance, stable identifiers, corrections, licensing,
and redistribution/API terms. One candidate is the
[Encyclopedia of Translated Prophetic Hadiths developer API](https://hadeethenc-content.islamcontent.com/en/developers_api),
which focuses on translated authentic hadiths and explanations. Its precise
license, versioning, correction process, API limits, and suitability for local
bundling must be confirmed directly with the provider.

### Processing options

- Small licensed dataset bundled locally: `processing: 'browser'`.
- Project-hosted licensed index: `processing: 'server'`.
- Provider API: `processing: 'cloud-api'` with the provider named in the catalog
  and tool UI.

User search queries can reveal beliefs or personal concerns; do not log them or
attach analytics.

### Tests and review

- Exact text and metadata checksums against a pinned source release.
- Reference-number mapping fixtures across editions where supported.
- Arabic/translation separation and attribution in every export format.
- Missing, disputed, corrected, or withdrawn records fail visibly.
- Review by a hadith-domain specialist before public availability.

### Recommendation

Run a source and licensing investigation first. Do not promise broad hadith
search until a maintainable canonical dataset and correction process exist.

---

## 9. Mosque Prayer Timetable Builder

### User job

Turn a mosque's supplied adhan, iqamah, Friday-prayer, class, or special-event
times into a consistent timetable that can be printed and shared.

### Recommended MVP

- Manual table entry and CSV paste/import.
- Daily, weekly, monthly, and Ramadan templates.
- Separate fields for calculated prayer start, mosque iqamah, and Friday prayer.
- Arabic, English, and bilingual layouts with correct RTL table behavior.
- Mosque name, location, contact information, logo, and notes.
- Print stylesheet plus PDF, PNG, CSV, and `.ics` export where appropriate.
- Visible “Times supplied by…” attribution and generation date.

### Important boundary

Version one does not calculate prayer times. It validates formatting and obvious
ordering but never silently corrects a mosque's supplied value. If a row looks
unusual, it asks the user to review it.

A later “calculate draft” button may use the single reviewed Prayer Times
engine. Calculated values must remain visually distinct from manual overrides,
and the export must show the method and adjustments.

### Processing and privacy

`processing: 'browser'`. Timetable CSV and logo never leave the browser. Provide
download/upload of a local project JSON file instead of requiring an account.
If optional local autosave is added, state clearly that it is saved only in that
browser and offer a delete action.

### Implementation shape

Create a shared timetable domain model and renderer rather than separate logic
for mosque, Ramadan, and event tables. Templates configure columns, labels, and
visual layout; they do not fork calculation or export code.

### Tests

- CSV round trips and explicit timezone handling.
- Manual overrides survive edit/export/import cycles.
- Distinguish prayer start, iqamah, and Friday prayer in all locales and exports.
- Multi-page print output, narrow mobile preview, Arabic numerals, and long names.
- No accidental network request while importing or exporting.

### Recommendation

One of the best first Islamic tools: useful, clearly scoped, browser-only, and
lower risk because it formats mosque-approved values rather than issuing them.
Combine the Ramadan Timetable Generator with this tool as a dedicated template.

---

## 10. Khutbah Planner & Timer

### User job

Help a khatib privately organize notes, sources, timing, and a printable outline
without generating religious content or prescribing a single sermon structure.

### Recommended MVP

- A distraction-light bilingual outline editor.
- User-defined sections with optional first/second-part grouping.
- Word count, estimated duration, and a rehearsal timer with lap markers.
- A source list for Quran, Hadith, books, and external references.
- Speaker mode with large type and elapsed/remaining time.
- Print, Markdown, plain text, and local JSON export/import.
- Optional device-only autosave with a visible clear-data control.

### Product boundaries

- Do not generate khutbah content, rulings, Quran translations, or Hadith
  references with AI.
- Do not label a structure as universally required unless a reviewed source is
  cited and the tool intentionally supports that methodology.
- Do not transmit drafts; sermon notes may contain sensitive personal or
  community matters.
- Citation fields are user-supplied in version one. A later integration may
  select verified Quran/Hadith records from the reviewed tools above.

### Processing and privacy

`processing: 'browser'`. Drafts stay in React state or explicit device-only
storage. Export is user-triggered. The page must not load third-party editors,
fonts, analytics, or spellcheck services. Browser-native spellcheck should be
optional because it may interact with operating-system/cloud features outside
the site's control.

### Implementation shape

- A small serializable document schema with a schema version.
- Pure import/export and duration-estimation functions with unit tests.
- Timer state based on monotonic elapsed time so tab pauses and render delays do
  not accumulate drift.
- Accessible keyboard controls and a wake-lock enhancement only when supported;
  speaker mode must still work without it.

### Tests

- Export/import round trip and migration of older schema versions.
- Timer start, pause, resume, reset, and long-background-tab behavior.
- Arabic mixed with references, numbers, and URLs.
- Printing does not include editor controls or omit source notes.
- Autosave off by default or clearly disclosed, and “clear draft” removes it.

### Recommendation

Best first build. It is genuinely Islamic in purpose, technically modest,
useful without external services, and does not calculate a ruling or alter
canonical religious text.

---

## Recommended delivery sequence

### Phase 0 — domain and data governance

Before adding more catalog promises:

1. Appoint named domain reviewers for prayer/Qibla/calendar, Quran/Hadith,
   Zakat, and inheritance work.
2. Adopt a dataset record format covering source, version, license, checksum,
   corrections URL, and last review date.
3. Define a standard “method/source/limitations” block reused on tool pages and
   in exports.
4. Define what `experimental` means for religious tools; ideally the interface
   is runnable but not yet approved for reliance, rather than only a roadmap
   page.

### Phase 1 — low-risk, browser-only Islamic workflows

1. Khutbah Planner & Timer.
2. Mosque Prayer Timetable Builder with Ramadan template.

These establish reusable local import/export, print, and bilingual editor/table
patterns without religious calculation engines.

### Phase 2 — reviewed reference and geometry tools

3. Quran Citation & Sharing Tool.
4. Static Qibla Finder.
5. Hijri–Gregorian Converter with explicit variants.

### Phase 3 — reviewed calculation engine

6. Prayer Times Calculator.
7. Add calculated draft times to the timetable builder only by reusing that
   engine.

### Phase 4 — specialist programs, not ordinary features

8. Hadith Reference Finder after data/licensing approval.
9. Zakat Calculator after scholar-approved methodology scenarios.
10. Islamic Inheritance Calculator only with a dedicated fara'id review group.

## Definition of done for every Islamic tool

- [ ] English and natural Arabic UI are complete and reviewed.
- [ ] RTL, mobile, keyboard, screen-reader, print, and reduced-motion behavior
      are tested where applicable.
- [ ] Processing location is literally accurate and shown before sensitive input.
- [ ] `METHODOLOGY.md` is complete for calculations or religious content.
- [ ] Every dataset has source, version, license, checksum, and update policy.
- [ ] Every recognized convention or school difference is visible or explicitly
      out of scope.
- [ ] Reference fixtures cite an independent source of truth.
- [ ] Errors and unsupported cases stop visibly; no silent fallback.
- [ ] Copied/downloaded results retain method, source, and limitation notices.
- [ ] Domain-knowledgeable maintainer sign-off is recorded.
- [ ] Catalog, sitemap, roadmap issue, tests, lint, typecheck, and production
      build all pass before `available`.

## Source shortlist for future methodology work

- [Waqf Toolkit calculation methodology template](templates/calculation-methodology.md)
- [Adhan JavaScript prayer-time library](https://github.com/batoulapps/adhan-js)
- [PrayTimes calculation-method comparison](https://praytimes.org/docs/methods)
- [GeographicLib JavaScript geodesic implementation](https://github.com/geographiclib/geographiclib-js)
- [Unicode CLDR Islamic calendar variants](https://cldr.unicode.org/translation/displaynames/locale-option-names-key)
- [AAOIFI Shari'ah Standard No. 35: Zakah](https://aaoifi.com/download/24233/)
- [Quran Foundation API documentation](https://api-docs.quran.com/docs/api-reference/)
- [Tanzil Quran text and license](https://tanzil.ca/docs/text_license)
- [Encyclopedia of Translated Prophetic Hadiths API](https://hadeethenc-content.islamcontent.com/en/developers_api)

These are candidate inputs to review, not automatic endorsements. Each tool's
domain reviewer must approve the exact source set and interpretation used by
the implementation.
