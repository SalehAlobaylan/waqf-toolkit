import { describe, expect, it } from 'vitest'
import {
  DATASETS,
  SACRED_KINDS,
  datasetRevision,
  datasetsOfKind,
  getDataset,
} from './datasets'
import { duaChecksum } from '@/tools/card-studio/data/duas'
import { quoteChecksum } from '@/tools/card-studio/data/quotes'
import { QURAN_DATASET_CHECKSUM } from '@/tools/card-studio/data/quran'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

describe('dataset registry', () => {
  it('has unique, kebab-free ids', () => {
    const ids = DATASETS.map((dataset) => dataset.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id.trim()).not.toBe('')
  })

  it('declares full provenance for every dataset', () => {
    for (const dataset of DATASETS) {
      expect(dataset.name.trim(), dataset.id).not.toBe('')
      expect(dataset.source.trim(), dataset.id).not.toBe('')
      expect(dataset.version.trim(), dataset.id).not.toBe('')
      expect(dataset.license.trim(), dataset.id).not.toBe('')
      expect(dataset.checksum.trim(), dataset.id).not.toBe('')
      expect(['verbatim', 'derived'], dataset.id).toContain(dataset.textFidelity)
      expect(['candidate', 'in-review', 'verified'], dataset.id).toContain(
        dataset.review.state,
      )
    }
  })

  it('never allows modification of sacred text', () => {
    for (const dataset of DATASETS) {
      if (SACRED_KINDS.includes(dataset.kind)) {
        expect(dataset.allowModification, dataset.id).toBe(false)
      }
    }
  })

  it('requires a named reviewer and date for verified datasets', () => {
    for (const dataset of DATASETS) {
      if (dataset.review.state !== 'verified') continue
      expect(dataset.review.reviewedBy?.trim(), dataset.id).toBeTruthy()
      expect(dataset.review.reviewedAt, dataset.id).toMatch(ISO_DATE)
    }
  })

  it('keeps registry checksums in sync with the shipped datasets', () => {
    expect(getDataset('card-studio.quran.uthmani')?.checksum).toBe(
      QURAN_DATASET_CHECKSUM,
    )
    expect(getDataset('card-studio.dua.hisn-starter')?.checksum).toBe(duaChecksum())
    expect(getDataset('card-studio.quote.curated')?.checksum).toBe(quoteChecksum())
    // A generated dataset must also pin the checksum of its source file.
    expect(getDataset('card-studio.quran.uthmani')?.sourceChecksum).toBe('7410caf5dc5b337de917b47ed887e3cb')
  })

  it('exposes revision strings that travel with exports', () => {
    const revision = datasetRevision('card-studio.quran.uthmani')
    expect(revision).toContain(QURAN_DATASET_CHECKSUM)
    expect(datasetRevision('missing.dataset')).toBe('unknown')
    expect(datasetsOfKind('quran')).toHaveLength(1)
  })
})
