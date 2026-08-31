import { getMethod, type AsrJuristic, type HighLatRule, type PrayerMethod } from './methods'

export type PrayerTimesInput = {
  latitude: number
  longitude: number
  /** Gregorian date (year/month/day are used; time-of-day ignored) */
  date: Date
  /** IANA timezone, e.g. "Asia/Riyadh" — never infer from longitude */
  timeZone: string
  methodId: string
  /** Used when methodId === 'custom' */
  customFajrAngle?: number
  customIshaAngle?: number
  asrJuristic: AsrJuristic
  highLatRule: HighLatRule
  /** Manual minute offsets per prayer (positive = later) */
  adjustments?: Partial<Record<PrayerName, number>>
  /** Rounding: 'nearest' | 'floor' | 'ceil' — currently nearest minute */
  rounding?: 'nearest'
}

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
export type PrayerTimesResult =
  | {
      ok: true
      times: Record<PrayerName, string> // "HH:MM" in the requested timezone
      meta: {
        method: PrayerMethod
        asrJuristic: AsrJuristic
        highLatRule: HighLatRule
        adjustments: Partial<Record<PrayerName, number>>
        timeZone: string
        dateISO: string // YYYY-MM-DD
        latitude: number
        longitude: number
      }
    }
  | { ok: false; reason: 'invalid-input' | 'invalid-timezone' | 'polar-unresolved'; details?: string }

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

function degSin(d: number): number { return Math.sin(d * DEG2RAD) }
function degCos(d: number): number { return Math.cos(d * DEG2RAD) }
function degTan(d: number): number { return Math.tan(d * DEG2RAD) }
function degAsin(x: number): number { return Math.asin(x) * RAD2DEG }
function degAcos(x: number): number { return Math.acos(Math.min(1, Math.max(-1, x))) * RAD2DEG }
function degAtan2(y: number, x: number): number { return Math.atan2(y, x) * RAD2DEG }

// Julian Day at 0h UTC
function julianDay(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  let Y = y
  let M = m
  if (M <= 2) { Y -= 1; M += 12 }
  const A = Math.floor(Y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5
}

function sunPosition(jd: number): { declination: number; equationMinutes: number } {
  const D = jd - 2451545.0
  const g = (357.529 + 0.98560028 * D) % 360
  const q = (280.459 + 0.98564736 * D) % 360
  const L = (q + 1.915 * degSin(g) + 0.02 * degSin(2 * g)) % 360
  const e = 23.439 - 0.00000036 * D
  const declination = degAsin(degSin(e) * degSin(L))
  let RA = degAtan2(degCos(e) * degSin(L), degCos(L)) / 15
  RA = ((RA % 24) + 24) % 24
  const eqt = q / 15 - RA
  const equationMinutes = ((eqt + 12) % 24 - 12) * 60 // normalize to [-720,720]
  return { declination, equationMinutes }
}

function hourAngle(angleDeg: number, lat: number, decl: number): number | null {
  // angle is depression below horizon, positive. For sunrise/sunset angle = 0.833 (refraction)
  // Formula: cos H = (sin(-angle) - sin lat sin decl) / (cos lat cos decl) ??? but we use standard.
  // For generic angle a (e.g. 18 for Fajr): cos H = (-sin a - sin lat sin decl)/(cos lat cos decl)
  // However for sunrise, a = 0.833, for Fajr a = fajrAngle etc.
  const numerator = -degSin(angleDeg) - degSin(lat) * degSin(decl)
  const denominator = degCos(lat) * degCos(decl)
  const cosH = numerator / denominator
  if (cosH < -1 || cosH > 1) return null // sun never reaches that angle
  return degAcos(cosH) / 15 // hours
}

function midDay(longitude: number, equationMinutes: number, tzOffsetMinutes: number): number {
  // solar noon in hours from 0h local time
  // 12 - equation/60 - lon/15 + tzOffset/60 ??? careful: tzOffset is minutes east of UTC
  // equation is (apparent - mean) in minutes. Standard: transit = 12 - lon/15 - eqt/60 + tz/60
  // Using lon positive east.
  return 12 - longitude / 15 - equationMinutes / 60 + tzOffsetMinutes / 60
}

function getTimezoneOffsetMinutes(date: Date, timeZone: string): number | null {
  try {
    void new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset',
    }).format(date)
    // Try to parse offset from part; fallback via time conversion.
    // More robust: compute difference between UTC and TZ wall time.
    const tzDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).format(date)
    // tzDateStr like "2026-03-15, 12:00:00"
    const isoLike = tzDateStr.replace(', ', 'T')
    const tzAsUTC = Date.parse(`${isoLike}Z`)
    const utcMs = date.getTime()
    // tzAsUTC is the wall time interpreted as UTC; difference gives offset.
    // But Date.parse interprets as UTC, so offset = (tzAsUTC - utcMs) ??? invert?
    // Example: date UTC 12:00, Riyadh wall 15:00, tzAsUTC = 15:00 UTC, utcMs=12:00 => diff 180 min positive east.
    const offset = (tzAsUTC - utcMs) / 60000
    // Round to nearest minute, handle DST correctly per instant.
    // Intl may give fractional offsets (e.g. 330), keep.
    if (!Number.isFinite(offset)) return null
    // Clamp to valid range ±14h
    if (Math.abs(offset) > 14 * 60) return null
    // Round to 15-min increments to avoid floating errors
    return Math.round(offset)
  } catch {
    return null
  }
}

function floatHoursToHHMM(h: number): string {
  // Normalize to [0,24)
  let hours = h
  hours = ((hours % 24) + 24) % 24
  let minutes = Math.round(hours * 60)
  minutes = ((minutes % 1440) + 1440) % 1440
  const hh = Math.floor(minutes / 60)
  const mm = minutes % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function calculatePrayerTimes(input: PrayerTimesInput): PrayerTimesResult {
  const { latitude, longitude, date, timeZone, methodId, asrJuristic, highLatRule, adjustments } = input

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, reason: 'invalid-input', details: 'latitude/longitude out of range' }
  }
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return { ok: false, reason: 'invalid-input', details: 'invalid date' }
  }
  if (!timeZone || typeof timeZone !== 'string') {
    return { ok: false, reason: 'invalid-input', details: 'missing timeZone' }
  }

  let method: PrayerMethod | undefined
  let fajrAngle: number
  let ishaAngle: number | null
  let ishaInterval: number | undefined

  if (methodId === 'custom') {
    fajrAngle = input.customFajrAngle ?? 18
    ishaAngle = input.customIshaAngle ?? 17
    if (!Number.isFinite(fajrAngle) || fajrAngle <= 0 || fajrAngle > 30) {
      return { ok: false, reason: 'invalid-input', details: 'customFajrAngle' }
    }
    if (ishaAngle !== null && (!Number.isFinite(ishaAngle) || ishaAngle <= 0 || ishaAngle > 30)) {
      return { ok: false, reason: 'invalid-input', details: 'customIshaAngle' }
    }
    method = {
      id: 'custom',
      name: 'Custom',
      nameAr: 'مخصص',
      fajrAngle,
      ishaAngle,
      source: 'User custom',
      version: '1.0.0',
    }
  } else {
    method = getMethod(methodId)
    if (!method) return { ok: false, reason: 'invalid-input', details: 'unknown methodId' }
    fajrAngle = method.fajrAngle
    ishaAngle = method.ishaAngle
    ishaInterval = method.ishaIntervalMinutes
  }

  // Use wall-calendar date components directly — `date` is wall y-m-d in the user's local TZ,
  // but we reinterpret it as the target wall date. For DST-sensitive zones we
  // compute the offset at local noon (more stable than midnight) to reduce transition-day error.
  const wallYear = date.getFullYear()
  const wallMonth = date.getMonth()
  const wallDay = date.getDate()
  const noonUtcForOffset = new Date(Date.UTC(wallYear, wallMonth, wallDay, 12, 0, 0))
  const tzOffset = getTimezoneOffsetMinutes(noonUtcForOffset, timeZone)
  if (tzOffset === null) {
    return { ok: false, reason: 'invalid-timezone', details: timeZone }
  }

  const jd = julianDay(new Date(Date.UTC(wallYear, wallMonth, wallDay)))
  // Add 0.5 to get 0h? julianDay returns 0h UTC JD at noon? Actually our julianDay returns 0h UTC (since -1524.5). Keep.

  const { declination, equationMinutes } = sunPosition(jd)
  const transit = midDay(longitude, equationMinutes, tzOffset)

  // Sunrise/sunset angle 0.833°
  const sunriseHA = hourAngle(0.833, latitude, declination)
  const fajrHA = hourAngle(fajrAngle, latitude, declination)
  const ishaHA = ishaAngle !== null ? hourAngle(ishaAngle, latitude, declination) : null

  // High-latitude handling: if any HA is null and rule is 'none', unresolved.
  // 'middle-of-night' / 'one-seventh' / 'angle-based' fallback to night-portion.
  // Simplified MVP: if fajr/isha HA null and highLatRule === 'none' => unresolved; otherwise use middle-of-night approximation.
  const isPolar = sunriseHA === null || fajrHA === null || (ishaAngle !== null && ishaHA === null)
  if (isPolar && highLatRule === 'none') {
    return { ok: false, reason: 'polar-unresolved', details: 'sun never reaches required depression' }
  }

  // Compute night duration approximation for fallback: sunset to sunrise
  // If polar and fallback needed, we estimate fajr/isha via middle-of-night.
  let fajrTime: number
  let ishaTime: number
  let sunriseTime: number | null = null
  let sunsetTime: number | null = null

  if (sunriseHA !== null) {
    sunriseTime = transit - sunriseHA
    sunsetTime = transit + sunriseHA
  }

  // Dhuhr: transit + ~2 min for solar transit correction? Keep exact.
  const dhuhr = transit

  // Asr: shadow factor
  const asrFactor = asrJuristic === 'hanafi' ? 2 : 1
  // Asr angle: cot^-1 (factor + tan(|lat - decl|))
  const asrAngle = RAD2DEG * Math.atan(1 / (asrFactor + degTan(Math.abs(latitude - declination))))
  // Asr HA: arccos((sin(asrAngle)- sinLat sinDecl)/(cosLat cosDecl))
  // But asrAngle is altitude above horizon; we need hour angle for that altitude.
  // Formula: cos H = (sin alt - sin lat sin decl)/(cos lat cos decl)
  function asrHourAngle(altDeg: number): number | null {
    const cosH = (degSin(altDeg) - degSin(latitude) * degSin(declination)) / (degCos(latitude) * degCos(declination))
    if (cosH < -1 || cosH > 1) return null
    return degAcos(cosH) / 15
  }
  const asrHA = asrHourAngle(asrAngle)
  const asrTime = asrHA !== null ? transit + asrHA : null

  // Fajr / Isha
  if (fajrHA !== null) {
    fajrTime = transit - fajrHA
  } else if (sunriseTime !== null && sunsetTime !== null) {
    // middle-of-night fallback
    const night = 24 - (sunsetTime - sunriseTime)
    if (highLatRule === 'middle-of-night') {
      fajrTime = sunriseTime - night / 2
    } else if (highLatRule === 'one-seventh') {
      fajrTime = sunriseTime - night / 7
    } else {
      fajrTime = sunriseTime - night / 2 // angle-based fallback same for MVP
    }
  } else {
    return { ok: false, reason: 'polar-unresolved' }
  }

  if (ishaAngle !== null) {
    if (ishaHA !== null) {
      ishaTime = transit + ishaHA
    } else if (sunriseTime !== null && sunsetTime !== null) {
      const night = 24 - (sunsetTime - sunriseTime)
      if (highLatRule === 'middle-of-night') ishaTime = sunsetTime + night / 2
      else if (highLatRule === 'one-seventh') ishaTime = sunsetTime + night / 7
      else ishaTime = sunsetTime + night / 2
    } else {
      return { ok: false, reason: 'polar-unresolved' }
    }
  } else {
    // fixed interval after Maghrib (sunset)
    if (sunsetTime === null) return { ok: false, reason: 'polar-unresolved' }
    ishaTime = sunsetTime + (ishaInterval ?? 90) / 60
  }

  if (sunriseTime === null || sunsetTime === null || asrTime === null) {
    return { ok: false, reason: 'polar-unresolved' }
  }

  const maghrib = sunsetTime // standard
  // Apply adjustments
  const adj = adjustments ?? {}
  const raw: Record<PrayerName, number> = {
    fajr: fajrTime + (adj.fajr ?? 0) / 60,
    sunrise: sunriseTime + (adj.sunrise ?? 0) / 60,
    dhuhr: dhuhr + (adj.dhuhr ?? 0) / 60,
    asr: asrTime + (adj.asr ?? 0) / 60,
    maghrib: maghrib + (adj.maghrib ?? 0) / 60,
    isha: ishaTime + (adj.isha ?? 0) / 60,
  }

  const times: Record<PrayerName, string> = {
    fajr: floatHoursToHHMM(raw.fajr),
    sunrise: floatHoursToHHMM(raw.sunrise),
    dhuhr: floatHoursToHHMM(raw.dhuhr),
    asr: floatHoursToHHMM(raw.asr),
    maghrib: floatHoursToHHMM(raw.maghrib),
    isha: floatHoursToHHMM(raw.isha),
  }

  // Ensure strictly increasing (except isha may wrap). Basic sanity: fajr < sunrise < dhuhr < asr < maghrib <= isha or isha next day.
  // We don't enforce strict failure — just document.

  return {
    ok: true,
    times,
    meta: {
      method: method!,
      asrJuristic,
      highLatRule,
      adjustments: adj,
      timeZone,
      dateISO: `${wallYear}-${String(wallMonth + 1).padStart(2, '0')}-${String(wallDay).padStart(2, '0')}`,
      latitude,
      longitude,
    },
  }
}

export { getTimezoneOffsetMinutes }
