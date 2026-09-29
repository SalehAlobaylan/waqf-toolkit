/**
 * Export payloads and the deep-link codec.
 *
 * Project files and deep links carry **references, not text**: an ayah is
 * `surah:ayah`, a dua is a dataset id. That keeps designs small, reviewable,
 * and honest — the rendered text always comes from the checksummed dataset, and
 * a stale dataset revision is *reported* rather than silently re-rendered.
 */

import { getDictionary, type Locale } from '@/i18n'
import type { CardBlock, CardBlockSpec, CardStyle, ManualQuote, ResolvedBlock } from '../types'
import { MAX_BLOCKS } from '../types'
import { isValidTemplateId, DEFAULT_TEMPLATE_ID } from './templates'
import { usedDatasetRevisions } from './resolve'
import type { CardDoc } from './blocks'

export const PROJECT_VERSION = 2
export const PROJECT_FILE_EXT = '.card.json'

export type ProjectStyle = Pick<CardStyle, 'frame' | 'digits'> & {
  template: string
  layout: 'classic' | 'feature'
}

export type ProjectFile = {
  tool: 'card-studio'
  version: number
  style: ProjectStyle
  blocks: CardBlock[]
  /** Dataset revisions the design was made against. */
  datasets: Record<string, string>
  /** Only user-authored content; always marked unverified on export. */
  custom?: { quote: ManualQuote }
  exportedAt: string
}

export function buildProjectFile(doc: CardDoc, exportedAt: string): ProjectFile {
  const custom = doc.blocks.find(
    (block) => block.kind === 'quote' && 'manual' in block,
  )
  return {
    tool: 'card-studio',
    version: PROJECT_VERSION,
    style: {
      template: doc.style.template,
      layout: doc.style.layout ?? 'classic',
      frame: doc.style.frame,
      digits: doc.style.digits,
    },
    blocks: doc.blocks,
    datasets: { card: 'v2' },
    ...(custom && 'manual' in custom
      ? { custom: { quote: custom.manual } }
      : {}),
    exportedAt,
  }
}

const FRAMES = ['square', 'portrait', 'story'] as const
const DIGITS = ['latn', 'arab'] as const

/** Defensive: a project file is untrusted input even from our own site. */
export function parseProjectFile(raw: unknown): { doc: CardDoc } | { error: 'shape' } {
  if (!raw || typeof raw !== 'object') return { error: 'shape' }
  const file = raw as Partial<ProjectFile>
  if (file.tool !== 'card-studio') return { error: 'shape' }
  if (typeof file.version !== 'number' || file.version > PROJECT_VERSION) {
    return { error: 'shape' }
  }
  const style = file.style
  if (!style || typeof style !== 'object') return { error: 'shape' }
  const template = typeof style.template === 'string' && isValidTemplateId(style.template)
    ? style.template
    : DEFAULT_TEMPLATE_ID
  const frame = FRAMES.includes(style.frame as (typeof FRAMES)[number])
    ? (style.frame as CardDoc['style']['frame'])
    : 'square'
  const digits = DIGITS.includes(style.digits as (typeof DIGITS)[number])
    ? (style.digits as CardDoc['style']['digits'])
    : 'latn'
  const layout = style.layout === 'feature' ? 'feature' : 'classic'
  const blocks = Array.isArray(file.blocks) ? file.blocks : []
  const clean: CardBlock[] = []
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const b = block as Record<string, unknown>
    const id = typeof b.id === 'string' && b.id !== '' ? b.id : `imported-${clean.length}`
    if (b.kind === 'ayah') {
      const surah = Number(b.surah)
      const ayahStart = Number(b.ayahStart)
      const ayahEnd = Number(b.ayahEnd)
      if (Number.isInteger(surah) && Number.isInteger(ayahStart) && Number.isInteger(ayahEnd)) {
        clean.push({ id, kind: 'ayah', surah, ayahStart, ayahEnd })
      }
    } else if (b.kind === 'dua' && typeof b.duaId === 'string') {
      clean.push({ id, kind: 'dua', duaId: b.duaId })
    } else if (b.kind === 'quote') {
      if (typeof b.quoteId === 'string') clean.push({ id, kind: 'quote', quoteId: b.quoteId })
      else if (b.manual && typeof b.manual === 'object') {
        const m = b.manual as Record<string, unknown>
        if (
          typeof m.text === 'string' &&
          typeof m.author === 'string' &&
          typeof m.work === 'string' &&
          typeof m.locator === 'string'
        ) {
          clean.push({
            id,
            kind: 'quote',
            manual: { text: m.text, author: m.author, work: m.work, locator: m.locator },
          })
        }
      }
    }
    if (clean.length >= MAX_BLOCKS) break
  }
  const resolvedLayout = layout
  return {
    doc: {
      blocks: clean,
      style: {
        ...style,
        template,
        frame,
        digits,
        layout: resolvedLayout,
      } as CardDoc['style'],
    },
  }
}

/** Machine-readable payload shared by Copy JSON and the PNG iTXt metadata. */
export function buildJsonExport(opts: {
  blocks: ResolvedBlock[]
  style: CardStyle
  footer: string
  locale: Locale
  generatedAt: string
}): string {
  const c = getDictionary(opts.locale).cardStudio
  const payload = {
    tool: 'card-studio',
    version: PROJECT_VERSION,
    generatedAt: opts.generatedAt,
    style: opts.style,
    datasets: usedDatasetRevisions(opts.blocks),
    blocks: opts.blocks.map((block) => ({
      ...block.provenance,
      arabic: block.arabic,
      basmala: block.basmala,
      citation: block.citation,
      unverified: block.unverified,
    })),
    footer: opts.footer,
    note: c.footerNote,
  }
  return JSON.stringify(payload, null, 2)
}

export function buildTextExport(blocks: ResolvedBlock[], footer: string): string {
  const parts = blocks.map((block) => {
    const body = block.basmala ? `${block.basmala}\n${block.arabic}` : block.arabic
    return `${body}\n— ${block.citation}`
  })
  return `${parts.join('\n\n')}\n\n${footer}\n`
}

// ---------------------------------------------------------------------------
// Deep links: a compact, human-inspectable encoding of a design.
//   ?b=ayah:2:255;dua:sayyid-istighfar;tpl=night-mushaf;lay=featured
// ---------------------------------------------------------------------------

export type DeepLink = {
  blocks: CardBlockSpec[]
  template: string
  layout: 'classic' | 'feature'
  frame: CardDoc['style']['frame']
  digits: CardDoc['style']['digits']
}

function encodeBlock(block: CardBlock): string | null {
  if (block.kind === 'ayah') return `ayah:${block.surah}:${block.ayahStart}:${block.ayahEnd}`
  if (block.kind === 'dua') return `dua:${block.duaId}`
  if ('quoteId' in block) return `quote:${block.quoteId}`
  return null // manual quotes are local; they never travel in a link
}

export function encodeDeepLink(doc: CardDoc): string {
  const parts: string[] = []
  for (const block of doc.blocks) {
    const encoded = encodeBlock(block)
    if (encoded) parts.push(encoded)
  }
  parts.push(`tpl:${doc.style.template}`)
  parts.push(`lay:${doc.style.layout ?? 'classic'}`)
  parts.push(`frm:${doc.style.frame}`)
  parts.push(`dig:${doc.style.digits}`)
  return parts.join(';')
}

export function decodeDeepLink(param: string): DeepLink | null {
  if (!param) return null
  const blocks: CardBlockSpec[] = []
  let template = DEFAULT_TEMPLATE_ID
  let layout: 'classic' | 'feature' = 'classic'
  let frame: CardDoc['style']['frame'] = 'square'
  let digits: CardDoc['style']['digits'] = 'latn'

  for (const token of param.split(';')) {
    const [head, ...rest] = token.split(':')
    const value = rest.join(':')
    if (head === 'ayah') {
      const [surah, from, to] = value.split(':').map(Number)
      if (Number.isInteger(surah) && Number.isInteger(from) && Number.isInteger(to)) {
        blocks.push({ kind: 'ayah', surah, ayahStart: from, ayahEnd: to })
      }
    } else if (head === 'dua' && value) {
      blocks.push({ kind: 'dua', duaId: value })
    } else if (head === 'quote' && value) {
      blocks.push({ kind: 'quote', quoteId: value })
    } else if (head === 'tpl' && isValidTemplateId(value)) {
      template = value
    } else if (head === 'lay') {
      layout = value === 'feature' ? 'feature' : 'classic'
    } else if (head === 'frm' && FRAMES.includes(value as (typeof FRAMES)[number])) {
      frame = value as CardDoc['style']['frame']
    } else if (head === 'dig' && DIGITS.includes(value as (typeof DIGITS)[number])) {
      digits = value as (typeof DIGITS)[number]
    }
  }
  if (blocks.length === 0) return null
  return { blocks: blocks.slice(0, MAX_BLOCKS), template, layout, frame, digits }
}

/** Human-facing share link for the current locale. */
export function shareUrl(locale: Locale, doc: CardDoc): string {
  const base =
    typeof window === 'undefined'
      ? 'https://waqf-toolkit.vercel.app'
      : window.location.origin
  return `${base}/${locale}/tools/card-studio?b=${encodeURIComponent(encodeDeepLink(doc))}`
}

/** Payload encoded in the verify QR: the same reference string the deep link uses. */
export function verifyPayload(doc: CardDoc): string {
  return encodeDeepLink(doc)
}
