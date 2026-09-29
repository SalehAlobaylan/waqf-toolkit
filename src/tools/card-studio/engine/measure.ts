/**
 * Measurement providers for the layout engine.
 *
 * `createStubMeasure` is pure and deterministic — it backs every unit test
 * and SSR fallback. `createDomMirror` measures with the browser's own text
 * engine (the same shaper that draws the final text), which is what makes
 * Arabic justification possible without touching a character.
 */

import type { Measurer } from './linebreak'

/** Deterministic approximation: width grows with glyph count and font size. */
export function createStubMeasure(perChar = 0.52): Measurer {
  return {
    width(text, font) {
      const size = Number(/(\d+)px/.exec(font)?.[1] ?? 16)
      return [...text].length * size * perChar
    },
  }
}

export type DomMirror = Measurer & {
  /** Warm the font so the first measure is not a fallback width. */
  load(fonts: string[]): Promise<void>
  dispose(): void
}

const MIRROR_CSS = [
  'position:fixed',
  'top:-10000px',
  'left:-10000px',
  'visibility:hidden',
  'white-space:pre',
  'word-spacing:normal',
  'letter-spacing:normal',
  'direction:rtl',
  'contain:strict',
].join(';')

/**
 * Measures runs in a hidden DOM node using the same font stack the canvas
 * draws with. Widths are cached per (font, text) because the same word is
 * measured on every layout pass.
 */
export function createDomMirror(doc: Document = document): DomMirror {
  const host = doc.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = MIRROR_CSS
  const node = doc.createElement('span')
  host.appendChild(node)
  doc.body.appendChild(host)
  const cache = new Map<string, number>()

  return {
    width(text, font) {
      const key = `${font}\u0000${text}`
      const hit = cache.get(key)
      if (hit !== undefined) return hit
      host.style.font = font
      node.textContent = text
      const width = node.getBoundingClientRect().width
      cache.set(key, width)
      return width
    },
    async load(fonts) {
      if (!('fonts' in doc)) return
      await Promise.all(fonts.map((font) => doc.fonts.load(font).catch(() => [])))
      cache.clear()
    },
    dispose() {
      cache.clear()
      host.remove()
    },
  }
}
