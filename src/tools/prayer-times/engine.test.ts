import { describe, expect, it } from 'vitest'
import { calculatePrayerTimes } from './engine'

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

describe('calculatePrayerTimes', () => {
  it('calculates Riyadh times with MWL and preserves order', () => {
    const date = new Date(2026, 2, 15) // 2026-03-15
    const r = calculatePrayerTimes({
      latitude: 24.7136,
      longitude: 46.6753,
      date,
      timeZone: 'Asia/Riyadh',
      methodId: 'muslim-world-league',
      asrJuristic: 'standard',
      highLatRule: 'middle-of-night',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const t = r.times
    // Order check
    expect(timeToMinutes(t.fajr)).toBeLessThan(timeToMinutes(t.sunrise))
    expect(timeToMinutes(t.sunrise)).toBeLessThan(timeToMinutes(t.dhuhr))
    expect(timeToMinutes(t.dhuhr)).toBeLessThan(timeToMinutes(t.asr))
    expect(timeToMinutes(t.asr)).toBeLessThan(timeToMinutes(t.maghrib))
    expect(timeToMinutes(t.maghrib)).toBeLessThan(timeToMinutes(t.isha))
    // Rough sanity: Riyadh mid-March Fajr ~04:4x, Dhuhr ~12:0x
    expect(t.fajr.startsWith('04') || t.fajr.startsWith('05')).toBe(true)
    expect(t.dhuhr.startsWith('12')).toBe(true)
  })

  it('Hanafi Asr is later than Standard', () => {
    const date = new Date(2026, 5, 15)
    const base = {
      latitude: 24.7136,
      longitude: 46.6753,
      date,
      timeZone: 'Asia/Riyadh',
      methodId: 'muslim-world-league' as const,
      highLatRule: 'middle-of-night' as const,
    }
    const std = calculatePrayerTimes({ ...base, asrJuristic: 'standard' })
    const han = calculatePrayerTimes({ ...base, asrJuristic: 'hanafi' })
    expect(std.ok && han.ok).toBe(true)
    if (std.ok && han.ok) {
      expect(timeToMinutes(han.times.asr)).toBeGreaterThan(timeToMinutes(std.times.asr))
    }
  })

  it('uses fixed interval for Umm al-Qura Isha ~90min after Maghrib', () => {
    const date = new Date(2026, 2, 15)
    const r = calculatePrayerTimes({
      latitude: 21.4225,
      longitude: 39.8262,
      date,
      timeZone: 'Asia/Riyadh',
      methodId: 'umm-al-qura',
      asrJuristic: 'standard',
      highLatRule: 'middle-of-night',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mag = timeToMinutes(r.times.maghrib)
    const isha = timeToMinutes(r.times.isha)
    const diff = (isha - mag + 1440) % 1440
    expect(diff).toBeGreaterThanOrEqual(85)
    expect(diff).toBeLessThanOrEqual(95)
  })

  it('applies manual adjustments', () => {
    const date = new Date(2026, 2, 15)
    const base = calculatePrayerTimes({
      latitude: 24.7136,
      longitude: 46.6753,
      date,
      timeZone: 'Asia/Riyadh',
      methodId: 'muslim-world-league',
      asrJuristic: 'standard',
      highLatRule: 'middle-of-night',
    })
    const adj = calculatePrayerTimes({
      latitude: 24.7136,
      longitude: 46.6753,
      date,
      timeZone: 'Asia/Riyadh',
      methodId: 'muslim-world-league',
      asrJuristic: 'standard',
      highLatRule: 'middle-of-night',
      adjustments: { fajr: 5 },
    })
    expect(base.ok && adj.ok).toBe(true)
    if (base.ok && adj.ok) {
      expect(timeToMinutes(adj.times.fajr) - timeToMinutes(base.times.fajr)).toBe(5)
    }
  })

  it('rejects invalid timezone', () => {
    const r = calculatePrayerTimes({
      latitude: 24.7,
      longitude: 46.6,
      date: new Date(2026, 2, 15),
      timeZone: 'Invalid/Zone',
      methodId: 'muslim-world-league',
      asrJuristic: 'standard',
      highLatRule: 'middle-of-night',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid-timezone')
  })

  it('handles polar case as unresolved when highLatRule none', () => {
    // Longyearbyen ~78N in summer
    const r = calculatePrayerTimes({
      latitude: 78.22,
      longitude: 15.64,
      date: new Date(2026, 5, 21),
      timeZone: 'Arctic/Longyearbyen',
      methodId: 'muslim-world-league',
      asrJuristic: 'standard',
      highLatRule: 'none',
    })
    // Should be polar-unresolved or succeed with fallback — for 'none' must be unresolved
    if (!r.ok) expect(r.reason).toBe('polar-unresolved')
    else {
      // if it succeeded, that means our fallback not triggered — but for 'none' we return unresolved
      // so this path shouldn't succeed in polar summer
      expect(r.ok).toBe(false)
    }
  })

  it('custom method uses supplied angles', () => {
    const r = calculatePrayerTimes({
      latitude: 51.5,
      longitude: -0.12,
      date: new Date(2026, 2, 15),
      timeZone: 'Europe/London',
      methodId: 'custom',
      customFajrAngle: 15,
      customIshaAngle: 15,
      asrJuristic: 'standard',
      highLatRule: 'middle-of-night',
    })
    expect(r.ok).toBe(true)
  })

  it('meta contains method and timezone', () => {
    const date = new Date(2026, 2, 15)
    const r = calculatePrayerTimes({
      latitude: 51.5,
      longitude: -0.12,
      date,
      timeZone: 'Europe/London',
      methodId: 'egyptian',
      asrJuristic: 'standard',
      highLatRule: 'middle-of-night',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.meta.method.id).toBe('egyptian')
    expect(r.meta.timeZone).toBe('Europe/London')
  })
})
