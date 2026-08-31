/**
 * Kaaba reference coordinate — versioned, cited, single source of truth.
 *
 * Value represents the center of the Kaaba structure as commonly cited in
 * WGS84 geodetic coordinates. This is a conventional reference point;
 * doctrinal interpretation of "direction" (great-circle vs rhumb line,
 * nearest vs initial great-circle) is documented in METHODOLOGY.md.
 *
 * Source: General Authority for Survey and Geospatial Information (Saudi Arabia)
 * publications and widely reproduced WGS84 coordinates for Masjid al-Haram.
 * Coordinates are rounded to 4 decimal places (~11m) as the angular
 * difference beyond that is far below usable compass accuracy.
 *
 * If this coordinate is updated, bump VERSION and document the change
 * in METHODOLOGY.md §4 and in tests.
 */
export const KAABA = {
  latitude: 21.4225,
  longitude: 39.8262,
  // WGS84 ellipsoid — the calculation model must match this datum.
  datum: 'WGS84' as const,
  version: '1.0.0',
  source: 'GASGI / commonly cited WGS84 for Masjid al-Haram',
} as const

/** Distance threshold (meters) below which bearing is considered undefined. */
export const AT_KAABA_THRESHOLD_METERS = 50

/** Near-antipodal threshold: angular distance > 179.5° is treated as ambiguous. */
export const ANTIPODAL_THRESHOLD_DEGREES = 179.5
