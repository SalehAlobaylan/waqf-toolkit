import { describe, expect, it } from 'vitest'
import { parsePreferredLocale } from './negotiate-locale'

describe('parsePreferredLocale', () => {
  it('defaults to en for null or empty headers', () => {
    expect(parsePreferredLocale(null)).toBe('en')
    expect(parsePreferredLocale('')).toBe('en')
  })

  it('respects quality values', () => {
    expect(parsePreferredLocale('ar;q=0.8,en;q=0.9')).toBe('en')
    expect(parsePreferredLocale('en;q=0.5,ar;q=0.9')).toBe('ar')
  })

  it('prefers the first entry when qualities tie', () => {
    expect(parsePreferredLocale('ar,en')).toBe('ar')
    expect(parsePreferredLocale('en,ar')).toBe('en')
  })

  it('matches on the base tag of regional variants', () => {
    expect(parsePreferredLocale('ar-SA,ar;q=0.9')).toBe('ar')
    expect(parsePreferredLocale('en-GB,en-US;q=0.8')).toBe('en')
  })

  it('is case-insensitive and whitespace-tolerant', () => {
    expect(parsePreferredLocale(' AR , en ; q = 0.5 ')).toBe('ar')
  })

  it('falls back to en when nothing matches', () => {
    expect(parsePreferredLocale('fr,de;q=0.7')).toBe('en')
  })

  it('treats malformed q values as zero-weight', () => {
    expect(parsePreferredLocale('ar;q=abc,en')).toBe('en')
  })
})
