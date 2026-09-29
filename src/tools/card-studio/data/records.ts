import { QURAN_DATASET_CHECKSUM, QURAN_SOURCE_MD5 } from './quran'
import { DUA_DATASET_VERSION, duaChecksum } from './duas'
import { QUOTE_DATASET_VERSION, quoteChecksum } from './quotes'
import type { DatasetRecord } from '@/data/datasets'

/**
 * Registry entries for the Card Studio datasets.
 *
 * Checksums and versions are imported from the dataset modules, so a text
 * change that forgets to update the registry cannot ship: the test recomputes
 * each checksum and compares.
 */

export const QURAN_DATASET: DatasetRecord = {
  id: 'card-studio.quran.uthmani',
  kind: 'quran',
  name: 'Quran — Uthmani (Tanzil)',
  nameAr: 'القرآن الكريم — نسخ عثماني (تنزيل)',
  source: 'Tanzil Project',
  sourceUrl: 'https://tanzil.net',
  version: 'tanzil-2026-09-13',
  license: 'Tanzil text notice (see data/quran/LICENSE.txt)',
  checksum: QURAN_DATASET_CHECKSUM,
  sourceChecksum: QURAN_SOURCE_MD5,
  correctionsUrl: 'http://tanzil.net/updates/',
  review: {
    state: 'verified',
    reviewedBy: 'build pipeline (source checksum + reconstruction test)',
    reviewedAt: '2026-09-13',
    note: 'Character-exact against the source file; basmala split is a documented, reconstruction-tested derivation.',
  },
  textFidelity: 'derived',
  allowModification: false,
}

export const DUA_DATASET: DatasetRecord = {
  id: 'card-studio.dua.hisn-starter',
  kind: 'dua',
  name: 'Dua — Hisn al-Muslim starter set',
  nameAr: 'الأدعية — مجموعة حصن المسلم الأولى',
  source: 'Hisn al-Muslim (ch. 27 selection) via in-repo Adhkar curation',
  version: DUA_DATASET_VERSION,
  license: 'Compilation text; redistributed in this repository',
  checksum: duaChecksum(),
  review: {
    state: 'candidate',
    note: 'Arabic strings curated in-repo; citations are candidates pending domain review (METHODOLOGY.md §6).',
  },
  textFidelity: 'verbatim',
  allowModification: false,
}

export const QUOTE_DATASET: DatasetRecord = {
  id: 'card-studio.quote.curated',
  kind: 'quote',
  name: 'Scholar quotes — curated candidates',
  nameAr: 'أقوال العلماء — مرشّحات منتقاة',
  source: 'Public-domain classical works (Ibn al-Qayyim, al-Shafi‘i)',
  version: QUOTE_DATASET_VERSION,
  license: 'Public domain',
  checksum: quoteChecksum(),
  review: {
    state: 'candidate',
    note: 'Wording and work/page references are candidates; exported as under review until verified.',
  },
  textFidelity: 'verbatim',
  allowModification: false,
}

export const DATASET_RECORDS: DatasetRecord[] = [
  QURAN_DATASET,
  DUA_DATASET,
  QUOTE_DATASET,
]
