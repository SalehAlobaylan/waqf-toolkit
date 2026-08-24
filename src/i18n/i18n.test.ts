import { describe, expect, it } from 'vitest'
import { en } from './en'
import { ar } from './ar'

/** Recursively collect leaf-key paths of a nested object. */
function keyPaths(object: unknown, prefix = ''): string[] {
  if (typeof object !== 'object' || object === null) {
    return prefix ? [prefix] : []
  }
  return Object.entries(object).flatMap(([key, value]) =>
    keyPaths(value, prefix ? `${prefix}.${key}` : key),
  )
}

describe('i18n dictionaries', () => {
  it('EN and AR have identical key trees', () => {
    expect(keyPaths(ar).sort()).toEqual(keyPaths(en).sort())
  })

  it('no empty strings in either dictionary', () => {
    for (const path of keyPaths(en)) {
      const value = path.split('.').reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)[key],
        en,
      )
      expect(value, `en:${path}`).toBeTruthy()
    }
    for (const path of keyPaths(ar)) {
      const value = path.split('.').reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)[key],
        ar,
      )
      expect(value, `ar:${path}`).toBeTruthy()
    }
  })
})
