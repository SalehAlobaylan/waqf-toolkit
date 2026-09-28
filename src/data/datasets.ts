/**
 * Dataset registry — the app-wide source of truth for every bundled text
 * dataset.
 *
 * Rules (enforced by `datasets.test.ts`, so CI fails if any are broken):
 * - Every dataset declares source, version, license, checksum, and review
 *   state. There is no such thing as "an unnamed dataset" here.
 * - Sacred text (`quran`, `dua`, `quote`) is never modifiable: the exact
 *   strings are the unit of record and are shown verbatim.
 * - `verified` requires a named reviewer and a date. `candidate` is honest
 *   and allowed to ship — the catalog status carries the warning.
 * - The registry never stores copies of the text itself, only the record of
 *   where the text came from. Text lives in the tool's own dataset module.
 */

export type DatasetKind = 'quran' | 'dua' | 'quote' | 'translation' | 'metadata'

export type ReviewState = 'candidate' | 'in-review' | 'verified'

export type DatasetReview = {
  state: ReviewState
  /** Required when `state === 'verified'`. */
  reviewedBy?: string
  /** ISO date. Required when `state === 'verified'`. */
  reviewedAt?: string
  note?: string
}

export type DatasetRecord = {
  id: string
  kind: DatasetKind
  /** Human-readable name shown in the UI. */
  name: string
  /** Publisher / compiler / transcription source. */
  source: string
  sourceUrl?: string
  version: string
  license: string
  /** Content checksum of the exact strings shipped. */
  checksum: string
  /** Checksum of the upstream source file, when the dataset is generated. */
  sourceChecksum?: string
  correctionsUrl?: string
  review: DatasetReview
  /** `verbatim` = character-exact source text; `derived` = a documented transform. */
  textFidelity: 'verbatim' | 'derived'
  /** Sacred text may never be silently altered. Always false for sacred kinds. */
  allowModification: boolean
}

export const SACRED_KINDS: readonly DatasetKind[] = ['quran', 'dua', 'quote']

export function getDataset(id: string): DatasetRecord | undefined {
  return DATASETS.find((dataset) => dataset.id === id)
}

export function datasetsOfKind(kind: DatasetKind): DatasetRecord[] {
  return DATASETS.filter((dataset) => dataset.kind === kind)
}

/** `version+checksum` — the string that travels with exports and deep links. */
export function datasetRevision(id: string): string {
  const dataset = getDataset(id)
  if (!dataset) return 'unknown'
  return `${dataset.version}+${dataset.checksum}`
}

export function reviewLabel(review: DatasetReview): ReviewState {
  return review.state
}

/** Assembled from each tool's dataset module so values can never drift. */
import { DATASET_RECORDS } from '@/tools/card-studio/data/records'

export const DATASETS: DatasetRecord[] = DATASET_RECORDS
