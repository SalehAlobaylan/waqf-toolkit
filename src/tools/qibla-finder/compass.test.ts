import { describe, expect, it } from 'vitest'
import { dialRotationForHeading, headingFromEvent } from './compass'

describe('headingFromEvent', () => {
  it('prefers webkitCompassHeading', () => {
    const s = headingFromEvent({ alpha: 90, webkitCompassHeading: 45, webkitCompassAccuracy: 5, absolute: true })
    expect(s.heading).toBe(45)
    expect(s.accuracy).toBe(5)
  })

  it('handles alpha when absolute', () => {
    const s = headingFromEvent({ alpha: 30, absolute: true })
    // 360 - 30 = 330
    expect(s.heading).toBe(330)
  })

  it('falls back to alpha when not absolute', () => {
    const s = headingFromEvent({ alpha: 30, absolute: false })
    expect(s.heading).toBe(30)
  })

  it('returns null when no heading', () => {
    const s = headingFromEvent({ alpha: null })
    expect(s.heading).toBeNull()
  })
})

describe('dialRotationForHeading', () => {
  it('returns bearing when heading null', () => {
    expect(dialRotationForHeading(244, null)).toBe(244)
  })
  it('bearing - heading normalized', () => {
    expect(dialRotationForHeading(244, 0)).toBe(244)
    expect(dialRotationForHeading(244, 244)).toBe(0)
    expect(dialRotationForHeading(10, 350)).toBe(20)
  })
})
