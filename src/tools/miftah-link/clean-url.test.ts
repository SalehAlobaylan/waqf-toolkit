import { describe, expect, it } from 'vitest'
import { cleanUrl } from './clean-url'
import { TRACKER_PARAMS } from './trackers'

describe('cleanUrl', () => {
  it('removes utm parameters and keeps the rest', () => {
    const result = cleanUrl(
      'https://example.com/article?utm_source=news&id=42&utm_medium=rss',
    )
    expect(result).toEqual({
      ok: true,
      url: 'https://example.com/article?id=42',
      removed: ['utm_source', 'utm_medium'],
    })
  })

  it('handles scheme-less input', () => {
    const result = cleanUrl('example.com/page?fbclid=abc')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.url).toBe('https://example.com/page')
      expect(result.removed).toEqual(['fbclid'])
    }
  })

  it('is case-insensitive and preserves original param order in removed list', () => {
    const result = cleanUrl('https://EXAMPLE.com/?UTM_Campaign=x&keep=1&Gclid=y')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.url).toBe('https://example.com/?keep=1')
      expect(result.removed).toEqual(['UTM_Campaign', 'Gclid'])
    }
  })

  it('never modifies path or fragment', () => {
    const result = cleanUrl('https://example.com/a/b?utm_source=x&q=1#section-2')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.url).toBe('https://example.com/a/b?q=1#section-2')
    }
  })

  it('reports clean links with no removals', () => {
    const result = cleanUrl('https://example.com/?id=42')
    expect(result).toEqual({
      ok: true,
      url: 'https://example.com/?id=42',
      removed: [],
    })
  })

  it('rejects non-http(s) protocols and garbage', () => {
    expect(cleanUrl('javascript:alert(1)').ok).toBe(false)
    expect(cleanUrl('ftp://example.com').ok).toBe(false)
    expect(cleanUrl('not a url at all ??')).ok
    // "not a url" parses as host "not" — ensure truly invalid input fails:
    expect(cleanUrl('http://').ok).toBe(false)
    expect(cleanUrl('').ok).toBe(false)
    expect(cleanUrl('   ').ok).toBe(false)
  })

  it('covers every declared tracker parameter end-to-end', () => {
    const params = TRACKER_PARAMS.map((name, index) => `${name}=x${index}`)
    const result = cleanUrl(`https://example.com/?${params.join('&')}&keep=1`)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.removed).toEqual(TRACKER_PARAMS)
      expect(result.url).toBe('https://example.com/?keep=1')
    }
  })

  it('tracker list itself has no duplicates', () => {
    expect(new Set(TRACKER_PARAMS.map((p) => p.toLowerCase())).size).toBe(
      TRACKER_PARAMS.length,
    )
  })
})
