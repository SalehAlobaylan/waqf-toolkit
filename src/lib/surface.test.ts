import { describe, expect, it } from 'vitest'
import { isAppSurface, methodologyUrl, templateFor, toolPathFor } from './surface'
import { TOOL_LAYOUTS } from '@/lib/panes'

describe('toolPathFor', () => {
  it('parses a tool page in either locale', () => {
    expect(toolPathFor('/en/tools/qibla-finder')).toEqual({
      locale: 'en',
      slug: 'qibla-finder',
    })
    expect(toolPathFor('/ar/tools/card-studio')).toEqual({
      locale: 'ar',
      slug: 'card-studio',
    })
  })

  it('tolerates a trailing slash', () => {
    expect(toolPathFor('/en/tools/qibla-finder/')?.slug).toBe('qibla-finder')
  })

  it('rejects everything that is not a tool page', () => {
    for (const path of [
      '/',
      '/en',
      '/ar',
      '/en/tools',
      '/ar/tools/',
      '/en/contribute',
      '/en/tools/qibla-finder/try',
      '/fr/tools/qibla-finder',
      '/en/tools/qibla-finder/extra',
      '/en/tools/Qibla-Finder',
    ]) {
      expect(toolPathFor(path), path).toBeUndefined()
    }
  })
})

describe('templateFor', () => {
  it('gives every registered tool the app template', () => {
    for (const slug of Object.keys(TOOL_LAYOUTS)) {
      for (const locale of ['en', 'ar']) {
        expect(templateFor(`/${locale}/tools/${slug}`), slug).toBe('app')
      }
    }
  })

  it('falls back to the document template for informational tools', () => {
    for (const path of [
      '/en/tools/pdf-merger',
      '/ar/tools/video-music-remover',
      '/en/tools',
      '/en',
      '/en/contribute',
    ]) {
      expect(templateFor(path), path).toBe('document')
    }
  })
})

describe('isAppSurface', () => {
  it('is true only for registered tool pages', () => {
    expect(isAppSurface('/en/tools/card-studio')).toBe(true)
    expect(isAppSurface('/ar/tools/zakat-calculator')).toBe(true)
    expect(isAppSurface('/en/tools/pdf-merger')).toBe(false)
    expect(isAppSurface('/en')).toBe(false)
  })
})

describe('methodologyUrl', () => {
  it('points at the METHODOLOGY.md in the tool source directory', () => {
    expect(methodologyUrl('card-studio')).toBe(
      'https://github.com/SalehAlobaylan/waqf-toolkit/blob/main/src/tools/card-studio/METHODOLOGY.md',
    )
  })

  it('uses the source directory, not the slug, when they differ', () => {
    expect(methodologyUrl('prayer-times-widget')).toContain('/prayer-times/')
    expect(methodologyUrl('prayer-times-widget')).not.toContain(
      'prayer-times-widget',
    )
  })

  it('is undefined for tools without a registered surface', () => {
    expect(methodologyUrl('pdf-merger')).toBeUndefined()
    expect(methodologyUrl('nope')).toBeUndefined()
  })
})
