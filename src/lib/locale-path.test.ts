import { describe, expect, it } from 'vitest'
import { switchLocalePath } from './locale-path'

describe('switchLocalePath', () => {
  it('swaps the locale segment of a root path', () => {
    expect(switchLocalePath('/en', 'ar')).toBe('/ar')
  })

  it('preserves nested paths', () => {
    expect(switchLocalePath('/en/tools', 'ar')).toBe('/ar/tools')
    expect(
      switchLocalePath('/en/tools/miftah-link/try', 'ar'),
    ).toBe('/ar/tools/miftah-link/try')
  })

  it('keeps trailing slashes where present', () => {
    expect(switchLocalePath('/en/tools/', 'ar')).toBe('/ar/tools/')
  })

  it('handles a bare path without leading slash', () => {
    expect(switchLocalePath('', 'ar')).toBe('/ar')
  })
})
