# Calculation Methodology — Hijri–Gregorian Converter

> Per `CONTRIBUTING.md`, changes to religious calculations require domain-knowledgeable review in addition to code review. This document must be complete before the PR is merged.

---

## 1. What is calculated

Bidirectional conversion between Gregorian date `YYYY-MM-DD` (civil, midnight-to-midnight in a named IANA timezone) and Hijri date `YYYY-MM-DD` for an explicitly selected variant:
- `islamic-umalqura` (Saudi Umm al-Qura civil calendar, table-driven, 1356-1500 AH)
- `islamic-civil` (tabular arithmetic, 30-year cycle, 1-3000 AH)

Outputs per conversion: the counterpart date, JDN at noon UTC, variant label and version, Hijri month length, weekday, and the selected timezone. No moon-sighting prediction is attempted.

## 2. Inputs and their sources

| Input | Source | Validation |
|---|---|---|
| Gregorian `year/month/day` | `<input type=date>` (ISO `YYYY-MM-DD`) or Hijri→Gregorian reverse | `isValidGregorian`: pure proleptic Gregorian validation (year 1..9999, correct month lengths), no `Date` quirks for y<100 |
| Hijri `year/month/day` | Numeric inputs: year `input`, month `select 1-12`, day `input 1-30` | `1≤month≤12`, `1≤day≤monthLength(variant,year,month)`, year range per variant |
| Variant | Toggle `islamic-umalqura` (default) / `islamic-civil` — required, no silent fallback | Must be one of `SUPPORTED_VARIANTS`; else `invalid-variant` |
| Timezone | IANA zone selector (default `Intl.DateTimeFormat().resolvedOptions().timeZone` or `Asia/Riyadh`) — never inferred from coordinates | `isValidTimeZone` via `try new Intl.DateTimeFormat(...,{timeZone})`; invalid → `invalid-timezone` |
| Digit style | Toggle `latn` / `arab` | Presentation only; does not change JDN or conversion result |
| Month style | `long` vs `numeric` | Presentation only |

All inputs stay in memory; no network fetch. Day starts at civil midnight in the selected timezone, not at sunset — documented here and in UI warning.

## 3. Algorithm and conventions

**Common:**
- Julian Day Number at noon UTC (integer JDN) via `gregorianToJdn`:
  `a=(14-m)/12, yy=y+4800-a, mm=m+12*a-3, JDN=d + (153*mm+2)/5 +365*yy + yy/4 - yy/100 + yy/400 -32045` (Fliegel-Van Flandern, proleptic Gregorian).
- Inverse `jdnToGregorian` via Fliegel-Van Flandern.
- Weekday: `(JDN+1)%7` (0=Sunday).

**Umm al-Qura (`islamic-umalqura`):**
- Datum: bundled month-length table `umalqura-data.ts` v1.0.0, 1740 entries of 29/30 starting 1356-01-01 (Muharram 1356) → Gregorian 1937-03-14, `JDN=2428607`.
- `hijri→JDN`: `JDN = cumStarts[indexFor(y,m)] + (d-1)` where `cumStarts` is prefix sum of month lengths from epoch.
- `JDN→hijri`: binary search greatest `cumStarts[i] ≤ JDN`; `year = 1356 + floor(i/12)`, `month = i%12+1`, `day = JDN - cumStarts[i] +1`.
- Month length is looked up, not computed. Year length is sum of 12 months (354 or 355 irregularly).
- Valid range 1356-01-01 .. 1500-12-30 (Gregorian 1937-03-14 .. 2077-11-16). Outside → `out-of-range` error, no silent fallback to civil. Documented in UI. JDN bounds are `UMALQURA_FIRST_JDN=2428607 .. UMALQURA_LAST_JDN` from `umalqura-data.ts`.

**Tabular civil (`islamic-civil`):**
- Leap rule: `((11*y + 14) % 30) < 11` → leap years 2,5,7,10,13,16,18,21,24,26,29 in each 30-year cycle (Reingold & Dershowitz).
- `hijri→JDN`: `JDN = d + ceil(29.5*(m-1)) + (y-1)*354 + floor((3+11*y)/30) + 1948439 -1`. Epoch `CIVIL_EPOCH_JD=1948439` = 1-1-1 AH at noon → Gregorian 622-07-18 (Thursday epoch, `islamic-civil`).
- `JDN→hijri`: approximate `y = floor((30*(JDN-epoch)+10646)/10631)` (10631 = 30-year cycle days = 354*30+11), then adjust `y` until `hijriToJdCivil(y,1,1) ≤ JDN < hijriToJdCivil(y+1,1,1)`, then linear month search using `civilMonthLength`.
- `civilMonthLength`: odd months 30, even 29, Dhu al-Hijjah 30 in leap else 29.
- Valid range 1 AH .. 3000 AH; outside → `out-of-range`.

**Digit/month formatting** is separate from conversion: `formatHijriDate` uses `HIJRI_MONTH_NAMES_EN/AR` dictionaries; `numberingSystem` `latn`/`arab` only maps `0-9` → `٠-٩`. `Intl` is never used as conversion engine; it may optionally format long names only if `Intl.supportedValuesOf('calendar')` includes the variant, otherwise fallback dict — ensures reproducibility in `jsdom`.

**If two authorities could disagree, it is here:** variant choice, epoch (civil 1948439 Thursday vs 1948440 Friday), Umm al-Qura table version, month-length, day-boundary (midnight vs sunset), and that calculated Hijri may differ ±1-2 days from local moon-sighting.

## 4. Data sources

| Dataset | Origin | Version/date | License | Why trusted |
|---|---|---|---|---|
| Umm al-Qura month lengths 1356-1500 | Saudi official Umm al-Qura calendar as reproduced in `moment-hijri` (MIT) / `ummalqura` — 1740 month lengths, all 29/30 (1364-08 is 28 in table as per source, kept for ICU alignment) | `umalqura-saudi-1356-1500-v1.0.0` | Public facts / MIT (MIT-licensed reproduction) | Conventional Saudi civil calendar; cross-checked via `Intl.DateTimeFormat` `islamic-umalqura`: 1356-01-01=1937-03-14, 1445-01-01=2023-07-19, 1500-12-30=2077-11-16. Any extension beyond 1500 requires new table version. |
| Tabular civil algorithm | Reingold & Dershowitz *Calendrical Calculations* — 30-year cycle, leap rule above; epoch 1948439 | `tabular-30y-v1.0.0` | Public domain math | Deterministic arithmetic, reproducible across engines |
| Gregorian ↔ JDN | Fliegel-Van Flandern algorithm | v1.0.0 | Public domain | Standard, tested for 622..3000 |

## 5. Known limitations

- Calculated calendars ≠ observed moon-sighting. Umm al-Qura is a civil approximation to astronomical new-moon criteria; local announcements may differ by ±1-2 days. UI shows permanent warning in both languages and export retains it.
- Umm al-Qura valid only 1356-1500 AH (1937-2077 CE). Requests outside return explicit `out-of-range` error rather than clamped value. Tabular range is wider but not meaningful before 1 AH or beyond 3000 AH; outside also errors.
- Day starts at civil midnight in the selected timezone, not at sunset (Islamic day traditionally sunset-to-sunset). This is stated in methodology and UI note.
- Timezone is required for reproducibility but does not change JDN for date-only conversion; it is stored in result/export for traceability.
- This output is **not a fatwa**; users should verify with trusted local authorities for religious observances.

## 6. Review checklist (for reviewers)

- [ ] Methodology document is complete and specific
- [ ] Implementation matches the documented algorithm (`engine.ts`, `tabular.ts`, `umalqura.ts`)
- [ ] Convention choices are visible in the UI (variant toggle, version badge, warning), not hidden defaults
- [ ] Test cases cover known reference values (cite them in the tests)
- [ ] Domain-knowledgeable reviewer has signed off

## 7. Reference values used in tests

| Input | Expected output | Source of truth |
|---|---|---|
| Gregorian 1937-03-14 → Umm al-Qura | 1356-01-01 | Saudi Umm al-Qura calendar start; cumulative table |
| Gregorian 2023-07-19 → Umm al-Qura | 1445-01-01 | Official Saudi 1445-01-01 = 2023-07-19 |
| Gregorian 2023-07-19 → Civil | 1444-12-30 | Tabular arithmetic (difference demonstrates variant divergence) |
| Gregorian 2026-03-15 → Umm al-Qura | 1447-09-26 | Table binary search |
| Gregorian 2026-03-15 → Civil | 1447-09-27 | Tabular (1-day offset from Umm al-Qura) |
| Hijri 1356-01-01 umalqura → Gregorian | 1937-03-14 | Inverse of first entry |
| Hijri 1500-12-30 umalqura → Gregorian | 2077-11-16 | Last valid day, cross-checked via `UMALQURA_LAST_JDN` |
| Hijri 1447-09-30 umalqura | valid | Month length 30 for that month (table) |
| Hijri 1447-09-30 civil leap check | depends on year 1447 leap | Civil month length validation |
| Out-of-range 1355-12-29 umalqura | `out-of-range` | Before table start |
| Out-of-range Gregorian 1937-03-13 → umalqura | `out-of-range` | Before first month |
| Round-trip 2020-01-01 greg→hijri→greg (both variants) | identity | Within-variant round-trip invariant |

