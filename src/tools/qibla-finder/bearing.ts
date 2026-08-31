import { ANTIPODAL_THRESHOLD_DEGREES, AT_KAABA_THRESHOLD_METERS, KAABA } from './constants'

export type BearingResult =
  | { ok: true; bearing: number; distanceKm: number; method: string }
  | { ok: false; reason: 'invalid-coordinates' | 'at-kaaba' | 'antipodal-ambiguous' }

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
const EARTH_RADIUS_KM = 6371.0088

function toRad(d: number): number {
  return d * DEG2RAD
}

function toDeg(r: number): number {
  return r * RAD2DEG
}

function normalizeBearing(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/**
 * Great-circle distance (haversine) in km — sufficient for threshold checks.
 * Bearing itself uses spherical initial-bearing formula.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

function angularDistanceDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return toDeg(c)
}

export function isValidLatitude(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
}

export function isValidLongitude(lon: number): boolean {
  return Number.isFinite(lon) && lon >= -180 && lon <= 180
}

/**
 * Initial great-circle bearing from `from` toward the Kaaba, clockwise from true north.
 *
 * Model: spherical earth using the standard initial-bearing formula:
 *   θ = atan2(sin Δλ · cos φ2, cos φ1·sin φ2 − sin φ1·cos φ2·cos Δλ)
 * Documented in METHODOLOGY.md §3. For Qibla purposes the difference
 * vs WGS84 ellipsoid inverse azimuth is < 0.2° and well within phone-compass
 * limitations — the model is stated explicitly so it can be tightened later
 * to geographiclib if needed without changing the API.
 */
export function qiblaBearing(
  from: { latitude: number; longitude: number },
  kaaba: { latitude: number; longitude: number } = KAABA,
): BearingResult {
  const { latitude: lat1, longitude: lon1 } = from
  const { latitude: lat2, longitude: lon2 } = kaaba

  if (!isValidLatitude(lat1) || !isValidLongitude(lon1) || !isValidLatitude(lat2) || !isValidLongitude(lon2)) {
    return { ok: false, reason: 'invalid-coordinates' }
  }

  const distKm = haversineKm(lat1, lon1, lat2, lon2)
  if (distKm * 1000 < AT_KAABA_THRESHOLD_METERS) {
    return { ok: false, reason: 'at-kaaba' }
  }

  const ang = angularDistanceDeg(lat1, lon1, lat2, lon2)
  if (ang > ANTIPODAL_THRESHOLD_DEGREES) {
    return { ok: false, reason: 'antipodal-ambiguous' }
  }

  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const deltaLambda = toRad(lon2 - lon1)

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

  const theta = Math.atan2(y, x)
  const bearing = normalizeBearing(toDeg(theta))

  // atan2 handles the x=y=0 case, but we already filtered at-kaaba.
  if (!Number.isFinite(bearing)) {
    return { ok: false, reason: 'antipodal-ambiguous' }
  }

  return {
    ok: true,
    bearing,
    distanceKm: distKm,
    method: `spherical-initial-bearing/WGS84-Kaaba-v${KAABA.version}`,
  }
}

/** Helper for UI: format bearing with one decimal. */
export function formatBearing(bearing: number): string {
  return `${bearing.toFixed(1)}°`
}
