/**
 * Resolve stored blocks into display-ready, cited, dataset-tagged blocks.
 *
 * Sacred strings are read from the bundled datasets and never transformed.
 * Quran text has exactly one source (Tanzil); the Dua dataset deliberately
 * excludes Quranic items so sacred text never enters a card through a second
 * transcription (METHODOLOGY.md §2.2).
 */

import { getDictionary, type Locale } from '@/i18n'
import { formatNumber } from '../../hijri-converter/format'
import { datasetRevision } from '@/data/datasets'
import { HISN_DUAS } from '../data/duas'
import { CURATED_QUOTES } from '../data/quotes'
import { SURAHS, type SurahText } from '../data/quran'
import type { CardBlock, Digits, ResolvedBlock } from '../types'

export const QURAN_DATASET_ID = 'card-studio.quran.uthmani'
export const DUA_DATASET_ID = 'card-studio.dua.hisn-starter'
export const QUOTE_DATASET_ID = 'card-studio.quote.curated'

export type ResolveContext = {
  locale: Locale
  digits: Digits
  quran: Readonly<Record<number, SurahText>>
}

function localizeDigits(value: string, digits: Digits): string {
  if (digits !== 'arab') return value
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return value.replace(/\d/g, (digit) => map[Number(digit)]!)
}

export function validateManualQuote(quote: {
  text: string
  author: string
  work: string
  locator: string
}): boolean {
  return (
    quote.text.trim() !== '' &&
    quote.author.trim() !== '' &&
    quote.work.trim() !== '' &&
    quote.locator.trim() !== ''
  )
}

/**
 * Resolves blocks for rendering. Returns `null` while an ayah's surah is still
 * loading, so the UI shows a loading state instead of a partial card.
 */
export function resolveBlocks(
  blocks: CardBlock[],
  ctx: ResolveContext,
): ResolvedBlock[] | null {
  const dict = getDictionary(ctx.locale)
  const c = dict.cardStudio
  const num = (value: number) => formatNumber(value, ctx.digits, ctx.locale)
  const out: ResolvedBlock[] = []

  for (const block of blocks) {
    if (block.kind === 'ayah') {
      const meta = SURAHS[block.surah - 1]
      const text = ctx.quran[block.surah]
      if (!meta || !text) return null
      const start = Math.max(1, Math.min(block.ayahStart, block.ayahEnd))
      const end = Math.min(text.ayat.length, Math.max(block.ayahStart, block.ayahEnd))
      if (start > end) return null
      const arabic = text.ayat.slice(start - 1, end).join(' ')
      const basmala = text.basmala && start === 1 && block.surah !== 1 ? text.basmala : null
      const range =
        start === end
          ? `${num(block.surah)}:${num(start)}`
          : `${num(block.surah)}:${num(start)}–${num(end)}`
      out.push({
        key: block.id,
        label: c.labelAyah,
        arabic,
        basmala,
        citation:
          ctx.locale === 'ar' ? `${meta.nameAr} • ${range}` : `${meta.nameEn} • ${range}`,
        unverified: false,
        provenance: {
          kind: 'ayah',
          surah: block.surah,
          ayahStart: start,
          ayahEnd: end,
        },
      })
      continue
    }

    if (block.kind === 'dua') {
      const dua = HISN_DUAS.find((entry) => entry.id === block.duaId)
      if (!dua) return null
      const title = ctx.locale === 'ar' ? dua.titleAr : dua.titleEn
      out.push({
        key: block.id,
        label: c.labelDua,
        arabic: dua.arabic,
        basmala: null,
        citation: `${title} — ${localizeDigits(dua.source, ctx.digits)}`,
        unverified: false,
        provenance: {
          kind: 'dua',
          id: dua.id,
          source: dua.source,
          hisnRef: dua.hisnRef,
        },
      })
      continue
    }

    if ('quoteId' in block) {
      const quote = CURATED_QUOTES.find((entry) => entry.id === block.quoteId)
      if (!quote) return null
      const author = ctx.locale === 'ar' ? quote.authorAr : quote.authorEn
      const work = ctx.locale === 'ar' ? quote.workAr : quote.workEn
      const locator = ctx.locale === 'ar' ? quote.locatorAr : quote.locatorEn
      const unverified = !quote.verified
      const separator = ctx.locale === 'ar' ? '، ' : ', '
      out.push({
        key: block.id,
        label: c.labelQuote,
        arabic: quote.arabic,
        basmala: null,
        citation: `${author} — ${work}${locator ? `${separator}${locator}` : ''}${
          unverified ? ` — ${c.unverifiedSuffix}` : ''
        }`,
        unverified,
        provenance: {
          kind: 'quote',
          id: quote.id,
          author,
          work,
          locator,
          verified: quote.verified,
        },
      })
      continue
    }

    const manual = block.manual
    const separator = ctx.locale === 'ar' ? '، ' : ', '
    out.push({
      key: block.id,
      label: c.labelQuote,
      arabic: manual.text.trim(),
      basmala: null,
      citation: `${manual.author.trim()} — ${manual.work.trim()}${separator}${manual.locator.trim()} — ${
        c.unverifiedSuffix
      }`,
      unverified: true,
      provenance: {
        kind: 'quote',
        id: null,
        author: manual.author.trim(),
        work: manual.work.trim(),
        locator: manual.locator.trim(),
        verified: false,
      },
    })
  }

  return out
}

/** Footer carried inside the exported image: sources used + verification rule. */
export function buildCardFooter(blocks: ResolvedBlock[], locale: Locale): string {
  const c = getDictionary(locale).cardStudio
  const sources = new Set<string>()
  let hasQuran = false
  for (const block of blocks) {
    if (block.provenance.kind === 'ayah') {
      sources.add(c.sourceQuran)
      hasQuran = true
    } else if (block.provenance.kind === 'dua') {
      sources.add(c.sourceDua)
    } else {
      sources.add(c.sourceQuote)
    }
  }
  const list = [...sources].join(' · ')
  const base = c.footerSources.replace('{sources}', list)
  return `${base} ${c.footerVerify}${hasQuran ? ` ${c.footerNotMushaf}` : ''}`
}

/** Dataset ids a card actually depends on — the provenance panel + exports. */
export function usedDatasetIds(blocks: ResolvedBlock[]): string[] {
  const ids = new Set<string>()
  for (const block of blocks) {
    if (block.provenance.kind === 'ayah') ids.add(QURAN_DATASET_ID)
    else if (block.provenance.kind === 'dua') ids.add(DUA_DATASET_ID)
    else ids.add(QUOTE_DATASET_ID)
  }
  return [...ids]
}

export function usedDatasetRevisions(blocks: ResolvedBlock[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const id of usedDatasetIds(blocks)) out[id] = datasetRevision(id)
  return out
}
