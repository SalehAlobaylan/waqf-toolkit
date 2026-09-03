export const NISAB_GOLD_GRAMS = '85' as const
export const NISAB_SILVER_GRAMS = '595' as const
export const ZAKAT_RATE = '0.025' as const // 1/40
export const METHODOLOGY_VERSION = '1.0.0' as const

export const SUPPORTED_CURRENCIES = [
  'SAR',
  'USD',
  'EUR',
  'GBP',
  'TRY',
  'MYR',
  'IDR',
  'PKR',
  'EGP',
  'AED',
  'QAR',
  'KWD',
] as const

export type Currency = (typeof SUPPORTED_CURRENCIES)[number]

export const CURRENCY_DECIMALS: Record<string, number> = {
  SAR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  TRY: 2,
  MYR: 2,
  IDR: 0,
  PKR: 2,
  EGP: 2,
  AED: 2,
  QAR: 2,
  KWD: 3,
}

export const PURITY_TABLE: Record<string, string> = {
  '24': '1',
  '22': '0.9166666667',
  '21': '0.875',
  '18': '0.75',
}

export type NisabBasis = 'gold' | 'silver' | 'both'

export const NISAB_BASIS_OPTIONS: readonly NisabBasis[] = ['gold', 'silver', 'both'] as const
