# Calculation Methodology — Qibla Finder

> Per `CONTRIBUTING.md`, changes to religious calculations require domain-knowledgeable review in addition to code review. This document must be complete before the PR is merged.

---

## 1. What is calculated

The initial great-circle bearing from a user-supplied WGS84 point toward the Kaaba reference coordinate, measured clockwise from true north (0–360°), and the great-circle distance to the Kaaba. A static compass dial visualizes the bearing; no magnetic correction or live device orientation is used in the MVP.

## 2. Inputs and their sources

| Input | Source | Validation |
|---|---|---|
| Latitude / longitude | Manual decimal entry (privacy default) or `navigator.geolocation` after explicit user tap | `[-90,90]` / `[-180,180]`, finite; invalid → `invalid-coordinates` error |
| Timestamp | `Date.now()` at calculation time, for copy record only | Not used in bearing math |
| Kaaba coordinate | Bundled constant `KAABA` in `constants.ts` (lat 21.4225, lon 39.8262, datum WGS84, v1.0.0) | Single source of truth; version bump on change |

No network, map tile, or geocoding is used. Coordinates stay in memory; location permission is requested only if the user selects “Use my location” (Geolocation API, HTTPS-only).

## 3. Algorithm and conventions

*   **Datum & coordinate:** WGS84 Kaaba reference above; store as named constant, not literal.
*   **Model:** Spherical initial bearing:
    `θ = atan2(sin Δλ·cos φ2, cos φ1·sin φ2 − sin φ1·cos φ2·cos Δλ)` then normalized 0–360°.
    Documented as `spherical-initial-bearing/WGS84-Kaaba-v1.0.0`. Difference vs WGS84 ellipsoid inverse azimuth (e.g. `geographiclib-geodesic`) is < 0.2° globally — below phone-magnetometer accuracy (3–5°). A future tightening to ellipsoid does not change the API, only the `method` string.
*   **Direction interpretation:** Initial great-circle azimuth at the user location toward the Kaaba along the shortest great-circle path. The religious/geometric interpretation (“along a great circle”) is the conventional one for Qibla calculators; the document does not settle jurisprudential differences — it names the geometric choice.
*   **True vs magnetic:** Result is relative to **true north**. No declination is applied. Users align the static dial with a trusted true-north reference (map or physical compass with known declination). This is stated in the UI details panel.

**Rule of thumb:** if two authorities could disagree (Kaaba coordinate, sphere vs ellipsoid, great-circle vs rhumb line), it belongs here — currently sphere+great-circle+above Kaaba constant.

## 4. Data sources

| Dataset | Origin | Version/date | License | Why trusted |
|---|---|---|---|---|
| Kaaba WGS84 coordinate | GASGI / widely reproduced WGS84 for Masjid al-Haram | 21.4225/39.8262, v1.0.0 | Public fact | Conventional reference; reviewable, versioned, single occurrence in code |

No bundled tables; no external fetch.

## 5. Known limitations

*   Not a substitute for on-site verification; nearby metal, cases, or poor GPS degrade usable accuracy more than algorithm choice.
*   Near the Kaaba (< 50 m) bearing is reported as undefined (`at-kaaba`) rather than a random arrow.
*   Near the antipode (> 179.5° angular distance) bearing is ambiguous; reported as `antipodal-ambiguous`.
*   Poles produce a bearing but require a reliable true-north reference to use.
*   Live rotating compass (DeviceOrientation) is intentionally not in the MVP — limited browser support and magnetometer variability. If added later, it must show a calibration warning and fall back to the numeric bearing.

## 6. Review checklist (for reviewers)

*   [ ] Methodology document is complete and specific
*   [ ] Implementation matches the documented algorithm (`bearing.ts`)
*   [ ] Convention choices are visible in the UI or settings, not hidden defaults
*   [ ] Test cases cover known reference values (cite them in the tests)
*   [ ] Domain-knowledgeable reviewer has signed off

## 7. Reference values used in tests

| Input (from) | Expected bearing | Source of truth |
|---|---|---|
| Riyadh 24.7136,46.6753 | ~244.5° | Cross-checked with geographiclib / public Qibla calculators (tolerance 1.5° spherical vs WGS84) |
| London 51.5072,-0.1276 | ~118.9° | as above |
| New York 40.7128,-74.006 | ~58.5° | as above |
| Jakarta -6.2088,106.8456 | ~295.1° | as above |
| Cape Town -33.9249,18.4241 | ~23.3° | as above |
| Sydney -33.8688,151.2093 | ~277.5° | as above |
| At Kaaba 21.4225,39.8262 | `at-kaaba` | Threshold rule |
| Antipode -21.4225,-140.1738 | `antipodal-ambiguous` | Angular threshold |

