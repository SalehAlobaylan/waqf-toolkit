# Calculation Methodology — Prayer Times Calculator

> Per `CONTRIBUTING.md`, changes to religious calculations require domain-knowledgeable review in addition to code review. This document must be complete before the PR is merged.

---

## 1. What is calculated

Fajr, sunrise (shuruq), Dhuhr, Asr, Maghrib, and Isha as local clock times `HH:MM` for a user-supplied Gregorian date, WGS84 coordinate, and IANA timezone, under a named calculation method and juristic/adjustment choices.

## 2. Inputs and their sources

| Input | Source | Validation |
|---|---|---|
| Latitude / longitude | Manual decimal entry (default) or `navigator.geolocation` after explicit tap | `[-90,90]` / `[-180,180]`, finite |
| Gregorian date | Date picker (`YYYY-MM-DD`) | Valid calendar date |
| Timezone | IANA zone selector (e.g. `Asia/Riyadh`) — never inferred from longitude | Must be valid IANA; invalid → `invalid-timezone` error |
| Calculation method | Selector: `muslim-world-league` (18/17), `egyptian` (19.5/17.5), `umm-al-qura` (18.5 + 90 min), `kuwait`, `qatar`, or `custom` angles | Preset values are versioned in `methods.ts`; custom 0–30° |
| Asr juristic | `standard` (Shafi/Maliki/Hanbali, shadow×1) or `hanafi` (shadow×2) | Required |
| High-latitude rule | `middle-of-night`, `one-seventh`, `angle-based` (MVP middle-of-night), or `none` (strict) | If `none` and sun never reaches required depression → `polar-unresolved` |
| Polar behavior | Currently `middle-of-night` fallback vs `unresolved` |  |
| Manual adjustments | Per-prayer minute offsets (`-60..+60`) | Added after calculation |
| Rounding | `nearest` minute (MVP) | Documented |

No network fetch; all inputs stay in memory unless the user exports JSON/CSV.

## 3. Algorithm and conventions

*   **Solar position:** Declination δ and equation of time E via low-precision solar mean anomaly / ecliptic longitude (Meeus-caliber truncated series via `g`, `q`, `L` as in `engine.ts:sunPosition`). JD at 0h UTC of the requested Gregorian date (`julianDay`). Sufficient for daily prayer purposes (< 1 min error).
*   **Transit (Dhuhr base):** `transit = 12 - lon/15 - E/60 + tzOffset/60` where `tzOffset` is the IANA offset for that instant (via `Intl.DateTimeFormat` wall-time difference). Keeps timezone handling separate from solar math.
*   **Hour angles:** For generic depression `a` (positive below horizon): `cos H = (-sin a − sin φ·sin δ)/(cos φ·cos δ)`. If `|cos H| > 1` → sun never reaches that depression (polar). `a = 0.833°` for sunrise/sunset (refraction), `a = fajrAngle` / `ishaAngle` for Fajr/Isha.
*   **Dhuhr:** transit.
*   **Asr altitude:** `cot⁻¹(factor + tan|φ − δ|)` with factor 1 (standard) or 2 (Hanafi). Hour angle then `cos H = (sin alt − sin φ sin δ)/(cos φ cos δ)`, Asr = transit + H.
*   **Asr, sunrise, sunset:** as above.
*   **Maghrib:** sunset (standard).
*   **Isha (angle methods):** transit + H(ishaAngle).
*   **Isha (interval methods — Umm al-Qura, Qatar):** `Maghrib + 90 min` (documented limitation: historically 120 min in Ramadan; tool uses fixed 90 and states it).
*   **Fajr/Isha high-lat fallback:** if HA is null and `highLatRule !== 'none'`, estimate via night-portion (`night = 24 − (sunset − sunrise)`): `middle-of-night → ± night/2`, `one-seventh → ± night/7`. If `none` → `polar-unresolved`.
*   **Adjustments:** added after astronomical calc, before rounding.
*   **Rounding:** nearest minute, `HH:MM` 00–23 via `floatHoursToHHMM`.

**If two authorities could disagree, it is here:** method angles, Asr factor, high-lat rule, polar handling, interval vs angle for Isha, rounding, whether to add ~2 min for Dhuhr transit — all exposed in UI, none hidden.

## 4. Data sources

| Dataset | Origin | Version/date | License | Why trusted |
|---|---|---|---|---|
| Method angles | Muslim World League, Egyptian Authority, Umm al-Qura Univ. | `methods.ts` v1.0.0 | Public facts | Must be checked against current institutional publications before `available`; PrayTimes table and `adhan-js` used only as cross-check, not source of truth |
| Solar coefficients | Standard astronomical series (Meeus-like truncated) implemented in `engine.ts` | v1.0.0 | Public domain math | Low-precision sufficient for prayer times, reproducible |

## 5. Known limitations

*   Calculation is an **astronomical estimate**, not a local mosque announcement. Results may differ from a mosque that uses different conventions or moon-sighting-based Hijri transitions.
*   Umm al-Qura Isha fixed at 90 min; Ramadan 120-min interval not yet distinguished.
*   No adhan audio, notifications, iqamah, or mosque matching — intentionally out of scope.
*   Timezone is not inferred from longitude; user must choose IANA zone. DST transitions are handled via `Intl` offset for the exact instant — but historical zone database differences across browsers could shift by minutes on edge dates.
*   Polar unresolved state is explicit; never `NaN` or invented time.
*   This output is **not a fatwa**; users should verify with trusted local authorities.

## 6. Review checklist (for reviewers)

*   [ ] Methodology document is complete and specific
*   [ ] Implementation matches the documented algorithm (`engine.ts`, `methods.ts`)
*   [ ] Convention choices are visible in the UI or settings, not hidden defaults
*   [ ] Test cases cover known reference values (cite them in the tests)
*   [ ] Domain-knowledgeable reviewer has signed off

## 7. Reference values used in tests

| Input | Expected output | Source of truth |
|---|---|---|
| Riyadh 24.7136,46.6753 2026-03-15 Asia/Riyadh MWL standard | Fajr ≈ 04:5x, Dhuhr ≈ 12:0x, Maghrib ≈ 18:0x, ordered, Hanafi Asr later | Sanity vs institutional timetables; exact fixtures to be added after reviewer-approved timetable import |
| Umm al-Qura Makkah 21.4225,39.8262 2026-03-15 | Isha − Maghrib ≈ 90 min | Method definition |
| London 51.5,-0.12 2026-03-15 Europe/London | Custom angles accepted, returns ok | Algorithm smoke |
| Longyearbyen 78.22,15.64 2026-06-21 Arctic/Longyearbyen MWL none | `polar-unresolved` | High-lat rule |

