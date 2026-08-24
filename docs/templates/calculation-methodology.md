# Calculation Methodology Document — Template

> **Required for any tool involving religious calculations or content:**
> prayer times, Hijri calendar conversion, Qibla direction, Zakat
> computation, inheritance shares, Quran/Hadith data handling.
>
> Per [CONTRIBUTING.md](../../CONTRIBUTING.md), these tools require review
> from a domain-knowledgeable maintainer **in addition to** normal code
> review, and this document must exist and be complete before the pull
> request is merged.

Copy this file into your tool's directory (e.g. `src/tools/<tool>/METHODOLOGY.md`)
and fill in every section. Delete nothing; mark "N/A" with a justification if a
section truly does not apply.

---

## 1. What is calculated

One paragraph: exactly which outputs does the tool produce? (e.g. "Fajr,
Sunrise, Dhuhr, Asr, Maghrib, Isha times as local clock times for user-supplied
coordinates and date.")

## 2. Inputs and their sources

| Input | Source | Validation |
|---|---|---|
| e.g. Latitude/longitude | Device geolocation or manual entry | Bounded sanity checks; no network lookup |
| e.g. Date | Gregorian date picker | Valid range |

## 3. Algorithm and conventions

State every choice explicitly, with named references:

- Which algorithm/implementation is used (e.g. "astronomical calculations per
  [source], implemented in `times.ts`").
- Every convention with a legitimate range of opinions, e.g.:
  - Fajr/Isha angles or intervals (which convention, and why)
  - Madhab for Asr (Standard vs Hanafi)
  - Higher-latitude rule applied
- Calendar specifics (e.g. which Hijri arithmetic convention, tabular vs
  observational criteria) and whether output can differ from local moon
  sighting.

**Rule of thumb:** if two respected institutions could disagree about it, it
belongs here.

## 4. Data sources

List every bundled dataset or external data dependency (tables, angle values,
texts). For each: origin, version/date, license, and why it is trusted. Tools
must not silently fetch religious data from third-party APIs at runtime without
documenting it here.

## 5. Known limitations

What the tool deliberately does not do, and where results may legitimately
differ from what a user's local mosque announces.

## 6. Review checklist (for reviewers)

- [ ] Methodology document is complete and specific
- [ ] Implementation matches the documented algorithm
- [ ] Convention choices are visible in the UI or settings, not hidden defaults
- [ ] Test cases cover known reference values (cite them in the tests)
- [ ] Domain-knowledgeable reviewer has signed off

## 7. Reference values used in tests

| Input | Expected output | Source of truth |
|---|---|---|
| | | |
