/**
 * Compass capability detection and heading math — browser-only, no import side effects.
 *
 * Most laptops have no magnetometer; phones do. Even on phones, DeviceOrientation
 * requires HTTPS + user gesture (iOS requestPermission) and is unreliable near metal.
 * This module is pure detection + math; UI subscribes only after explicit user tap.
 */

export type CompassSupport = 'unsupported' | 'supported'
export type CompassPermission = 'granted' | 'denied' | 'prompt' | 'unsupported'

export type OrientationState = {
  heading: number | null // 0-360 clockwise from true north, null if unavailable
  accuracy: number | null // webkitCompassAccuracy in degrees, if available
  absolute: boolean | null
}

// Minimal event shape we care about
type OrientationEvent = {
  alpha: number | null // 0-360, 0 = north (varies by browser)
  absolute?: boolean
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

export function isCompassSupported(): boolean {
  if (typeof window === 'undefined') return false
  const hasGenericSensor = typeof (window as unknown as { Magnetometer?: unknown }).Magnetometer !== 'undefined'
  const hasOrientationEvent = 'DeviceOrientationEvent' in window
  const hasAbsolute = 'ondeviceorientationabsolute' in window
  // Laptops report DeviceOrientationEvent but have no magnetometer — gate on touch/coarse pointer
  const hasTouch = (() => {
    try {
      if (navigator.maxTouchPoints > 0) return true
      if (window.matchMedia('(pointer: coarse)').matches) return true
      if (window.matchMedia('(any-pointer: coarse)').matches) return true
    } catch {
      // ignore
    }
    return false
  })()
  // Require either Generic Sensor, or orientation event on a touch device
  if (hasGenericSensor) return true
  if (hasAbsolute && hasTouch) return true
  if (hasOrientationEvent && hasTouch) return true
  // WebKit iOS also exposes webkitCompassHeading only on devices with compass
  return false
}

export async function requestCompassPermission(): Promise<CompassPermission> {
  if (typeof window === 'undefined') return 'unsupported'
  const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent
  if (DOE && typeof DOE.requestPermission === 'function') {
    try {
      const result = await DOE.requestPermission()
      if (result === 'granted') return 'granted'
      if (result === 'denied') return 'denied'
      return 'prompt'
    } catch {
      return 'denied'
    }
  }
  // Android / desktop: try Permissions API for magnetometer/gyroscope
  try {
    const nav = navigator as unknown as { permissions?: { query: (desc: { name: string }) => Promise<{ state: string }> } }
    if (nav.permissions?.query) {
      // Some browsers use 'magnetometer', some 'gyroscope'
      const magnet = await nav.permissions.query({ name: 'magnetometer' as unknown as string }).catch(() => null)
      if (magnet?.state === 'granted') return 'granted'
      if (magnet?.state === 'denied') return 'denied'
    }
  } catch {
    // ignore
  }
  // No explicit permission model — allow to try listening
  return 'granted'
}

/** Pure: extract heading from event. Returns null if not a compass heading. */
export function headingFromEvent(event: OrientationEvent): OrientationState {
  // iOS WebKit provides webkitCompassHeading directly (0 = north, clockwise, true north if calibrated)
  if (typeof event.webkitCompassHeading === 'number' && Number.isFinite(event.webkitCompassHeading)) {
    return {
      heading: ((event.webkitCompassHeading % 360) + 360) % 360,
      accuracy: typeof event.webkitCompassAccuracy === 'number' ? event.webkitCompassAccuracy : null,
      absolute: event.absolute ?? null,
    }
  }
  if (typeof event.alpha === 'number' && Number.isFinite(event.alpha)) {
    // Spec: alpha 0 = device pointing north, but implementation varies.
    // For absolute orientation, alpha is compass heading clockwise from north.
    // We treat it as heading when absolute === true or webkit heading not available.
    // Normalize to 0-360 where 0 = north.
    // Note: some browsers report 360 - alpha; we expose raw and let UI show fallback note.
    const heading = ((360 - event.alpha) % 360 + 360) % 360
    // Actually spec says alpha is rotation around z, 0 = north. But many Androids report alpha as compass heading.
    // To avoid flipping, we try both: if webkit heading exists we used it above.
    // For generic, we use 360 - alpha to match iOS behavior where possible, but we also handle absolute flag.
    // Simpler: if absolute is true, use 360 - alpha; else use alpha directly as fallback and show low-accuracy warning.
    // For this MVP we use the raw alpha normalized and document that fallback is approximate.
    const normalized = event.absolute ? heading : ((event.alpha % 360) + 360) % 360
    return {
      heading: normalized,
      accuracy: typeof event.webkitCompassAccuracy === 'number' ? event.webkitCompassAccuracy : null,
      absolute: event.absolute ?? null,
    }
  }
  return { heading: null, accuracy: null, absolute: event.absolute ?? null }
}

export function dialRotationForHeading(bearing: number, heading: number | null): number {
  if (heading === null || !Number.isFinite(heading)) return bearing
  // We keep arrow fixed to bearing, rotate the dial's N marker opposite to heading,
  // or rotate arrow by bearing - heading. Simpler: arrow rotation = bearing - heading.
  return ((bearing - heading) % 360 + 360) % 360
}
