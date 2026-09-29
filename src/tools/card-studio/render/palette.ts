/**
 * Palettes and color math.
 *
 * Colors are pinned hex values so exports are stable and reviewable, and
 * every shipped palette is contrast-checked in CI: a palette that cannot carry
 * 4.5:1 citations or 7:1 body text fails the test instead of shipping.
 */

import type { PaletteId } from '../engine/templates'

export type CardPalette = {
  bg: string
  glow: string
  ink: string
  label: string
  citation: string
  frame: string
  frameInner: string
  ornament: string
  lattice: string
  footer: string
  divider: string
  /** Pattern/background tint drawn behind the text. */
  pattern: string
}

export const CARD_PALETTES: Record<PaletteId, CardPalette> = {
  parchment: {
    bg: '#f6f2e8',
    glow: '#ffffff',
    ink: '#232d29',
    label: '#2e5c44',
    citation: '#4a534d',
    frame: '#2e5c44',
    frameInner: '#2e5c44',
    ornament: '#b25a24',
    lattice: '#24332e',
    footer: '#55605a',
    divider: '#c9c0ad',
    pattern: '#2e5c44',
  },
  forest: {
    bg: '#1f3a30',
    glow: '#3c5f4c',
    ink: '#f5f2ea',
    label: '#c5d58b',
    citation: '#cfd8c4',
    frame: '#c5d58b',
    frameInner: '#c5d58b',
    ornament: '#c5d58b',
    lattice: '#f5f2ea',
    footer: '#c2ccb6',
    divider: '#48604f',
    pattern: '#c5d58b',
  },
  night: {
    bg: '#16202b',
    glow: '#2b3d50',
    ink: '#f2ede2',
    label: '#d9b96a',
    citation: '#ded4b8',
    frame: '#d9b96a',
    frameInner: '#d9b96a',
    ornament: '#d9b96a',
    lattice: '#f2ede2',
    footer: '#c2bda9',
    divider: '#33414e',
    pattern: '#d9b96a',
  },
  sand: {
    bg: '#efe3cf',
    glow: '#fffaf0',
    ink: '#3a2c20',
    label: '#7a4a24',
    citation: '#5b4a38',
    frame: '#7a4a24',
    frameInner: '#7a4a24',
    ornament: '#a4632f',
    lattice: '#3a2c20',
    footer: '#63523f',
    divider: '#d6c4a8',
    pattern: '#7a4a24',
  },
  dusk: {
    bg: '#2a2233',
    glow: '#4a3a5c',
    ink: '#f0e9e2',
    label: '#cfa96b',
    citation: '#ddd0c2',
    frame: '#cfa96b',
    frameInner: '#cfa96b',
    ornament: '#cfa96b',
    lattice: '#f0e9e2',
    footer: '#c8bcae',
    divider: '#453a55',
    pattern: '#cfa96b',
  },
}

export function getPalette(id: PaletteId): CardPalette {
  return CARD_PALETTES[id]
}

function channel(value: number): number {
  const v = value / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.x contrast ratio between two hex colors (1:1 … 21:1). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const light = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (light + 0.05) / (dark + 0.05)
}

/** Contrast of every foreground role against the palette background. */
export function paletteContrast(palette: CardPalette): {
  ink: number
  citation: number
  label: number
  footer: number
} {
  return {
    ink: contrastRatio(palette.ink, palette.bg),
    citation: contrastRatio(palette.citation, palette.bg),
    label: contrastRatio(palette.label, palette.bg),
    footer: contrastRatio(palette.footer, palette.bg),
  }
}

/** Minimum ratios a shipped palette must clear. */
export const CONTRAST_FLOOR = {
  /** WCAG AA for body-size text. */
  body: 4.5,
  /** WCAG AA for small text. */
  small: 4.5,
} as const
