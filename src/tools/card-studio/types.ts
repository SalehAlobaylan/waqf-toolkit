/**
 * Card Studio — compose Dua / Quran / scholar words into one card.
 *
 * A card is an ordered list of resolved text blocks. Blocks are laid out
 * sequentially (never overlapping), so sacred text is never placed under
 * another layer (METHODOLOGY.md).
 */

export type BlockKind = 'ayah' | 'dua' | 'quote'

/** Maximum combined blocks in one card. */
export const MAX_BLOCKS = 3

export type ManualQuote = {
  text: string
  author: string
  work: string
  locator: string
}

/** A block as stored in a project — data references only, no rendered text. */
export type CardBlock =
  | { id: string; kind: 'ayah'; surah: number; ayahStart: number; ayahEnd: number }
  | { id: string; kind: 'dua'; duaId: string }
  | { id: string; kind: 'quote'; quoteId: string }
  | { id: string; kind: 'quote'; manual: ManualQuote }

/** The same block without its editor key (collections, deep links, imports). */
export type CardBlockSpec =
  | { kind: 'ayah'; surah: number; ayahStart: number; ayahEnd: number }
  | { kind: 'dua'; duaId: string }
  | { kind: 'quote'; quoteId: string }
  | { kind: 'quote'; manual: ManualQuote }

export type ImageFrame = 'square' | 'portrait' | 'story'
export type CardVariant = 'classic' | 'feature'
export type ImageFormat = 'png' | 'jpeg' | 'webp'
export type ImageResolution = 'full' | 'compact'
export type Digits = 'latn' | 'arab'

export type CardStyle = {
  /** Template id from `engine/templates` (palette + type + ornaments + background). */
  template: string
  frame: ImageFrame
  /** Layout variant override; `null` means "follow the template". */
  layout: CardVariant | null
  format: ImageFormat
  resolution: ImageResolution
  digits: Digits
}

export const DEFAULT_STYLE: CardStyle = {
  template: 'parchment-classic',
  frame: 'square',
  layout: null,
  format: 'png',
  resolution: 'full',
  digits: 'latn',
}

export const FRAMES: Record<ImageFrame, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
}

/** Canvas pixel scale per resolution. Compact ≈ ¼ the bytes — share-friendly. */
export const IMAGE_SCALES: Record<ImageResolution, number> = { full: 2, compact: 1 }

/** Provenance carried through layout into every export. */
export type BlockProvenance =
  | { kind: 'ayah'; surah: number; ayahStart: number; ayahEnd: number }
  | { kind: 'dua'; id: string; source: string; hisnRef: string }
  | {
      kind: 'quote'
      id: string | null
      author: string
      work: string
      locator: string
      verified: boolean
    }

/** A block ready to render: display strings plus provenance. */
export type ResolvedBlock = {
  key: string
  label: string
  arabic: string
  /** Basmala shown above the ayah text (Quran blocks only, source-verbatim). */
  basmala: string | null
  citation: string
  unverified: boolean
  provenance: BlockProvenance
}

