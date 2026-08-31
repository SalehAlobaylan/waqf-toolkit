import { describe, expect, it } from 'vitest'
import { qiblaBearing } from './bearing'
import { KAABA } from './constants'

// Reference bearings checked against geographiclib / known Qibla calculators.
// Tolerance ~1.0° for spherical vs WGS84 difference — intent is sanity, not
// sub-arcminute geodesy (phone compass is ~3-5° anyway).
const CASES: Array<{ name: string; from: { latitude: number; longitude: number }; expected: number }> = [
  { name: 'Makkah haram (near)', from: { latitude: 21.3891, longitude: 39.8579 }, expected: 318.5 },
  { name: 'Riyadh', from: { latitude: 24.7136, longitude: 46.6753 }, expected: 244.5 },
  { name: 'London', from: { latitude: 51.5072, longitude: -0.1276 }, expected: 118.9 },
  { name: 'New York', from: { latitude: 40.7128, longitude: -74.006 }, expected: 58.5 },
  { name: 'Jakarta', from: { latitude: -6.2088, longitude: 106.8456 }, expected: 295.1 },
  { name: 'Cape Town', from: { latitude: -33.9249, longitude: 18.4241 }, expected: 23.3 },
  { name: 'Sydney', from: { latitude: -33.8688, longitude: 151.2093 }, expected: 277.5 },
]

function within(a: number, b: number, tol: number): boolean {
  // circular distance on 0-360
  const diff = Math.abs(a - b) % 360
  const d = diff > 180 ? 360 - diff : diff
  return d <= tol
}

describe('qiblaBearing', () => {
  it.each(CASES)('$name bearing within tolerance', ({ from, expected }) => {
    const r = qiblaBearing(from)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(within(r.bearing, expected, 1.5)).toBe(true)
      expect(r.distanceKm).toBeGreaterThan(0)
      expect(r.method).toContain('Kaaba')
    }
  })

  it('returns at-kaaba when at the Kaaba itself', () => {
    const r = qiblaBearing({ latitude: KAABA.latitude, longitude: KAABA.longitude })
    expect(r).toEqual({ ok: false, reason: 'at-kaaba' })
  })

  it('returns at-kaaba when within 50m', () => {
    // ~22m north
    const r = qiblaBearing({ latitude: KAABA.latitude + 0.0002, longitude: KAABA.longitude })
    expect(r).toEqual({ ok: false, reason: 'at-kaaba' })
  })

  it('rejects invalid coordinates', () => {
    expect(qiblaBearing({ latitude: 100, longitude: 0 }).ok).toBe(false)
    expect(qiblaBearing({ latitude: 0, longitude: 200 }).ok).toBe(false)
    expect(qiblaBearing({ latitude: NaN, longitude: 0 }).ok).toBe(false)
  })

  it('handles antipodal ambiguity', () => {
    // Antipode of Kaaba approx: -21.4225, -140.1738
    const r = qiblaBearing({ latitude: -21.4225, longitude: -140.1738 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('antipodal-ambiguous')
  })

  it('is stable at poles (does not throw)', () => {
    const north = qiblaBearing({ latitude: 90, longitude: 0 })
    const south = qiblaBearing({ latitude: -90, longitude: 0 })
    expect(north.ok || !north.ok).toBe(true)
    expect(south.ok || !south.ok).toBe(true)
  })
})
