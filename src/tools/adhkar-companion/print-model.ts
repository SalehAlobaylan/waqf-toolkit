import type { AnyDhikr } from './types'
import { isCustomDhikr } from './types'
import { DATASET_VERSION } from './adhkar-data'

export type PrintLayout = 'booklet' | 'checklist'
export type PrintCover = 'band' | 'light'

export type PrintRow = {
  id: string
  title: string
  arabic: string
  meaning: string
  source: string
  target: number
  custom: boolean
}

export type PrintModel = {
  setName: string
  dateISO: string
  count: number
  datasetVersion: string
  cover: PrintCover
  layout: PrintLayout
  rows: PrintRow[]
}

/**
 * Pure print model: ordered rows for the booklet/checklist plus cover meta.
 * No DOM, no dates inside — callers pass everything in, so it is unit-testable.
 */
export function printModel(
  items: AnyDhikr[],
  opts: {
    setName: string
    dateISO: string
    locale: 'en' | 'ar'
    meanings: boolean
    sources: boolean
    cover: PrintCover
    layout: PrintLayout
  },
): PrintModel {
  return {
    setName: opts.setName,
    dateISO: opts.dateISO,
    count: items.length,
    datasetVersion: DATASET_VERSION,
    cover: opts.cover,
    layout: opts.layout,
    rows: items.map((i) => ({
      id: i.id,
      title: opts.locale === 'ar' ? i.titleAr : i.titleEn,
      arabic: i.arabic,
      meaning: opts.meanings ? (opts.locale === 'ar' ? i.meaningAr : i.meaningEn) : '',
      source: opts.sources ? `${i.source} · ${i.hisnRef}` : '',
      target: i.target,
      custom: isCustomDhikr(i),
    })),
  }
}
