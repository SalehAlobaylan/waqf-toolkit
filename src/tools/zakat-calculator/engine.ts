import Decimal from 'decimal.js'
import {
  CURRENCY_DECIMALS,
  METHODOLOGY_VERSION,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  PURITY_TABLE,
  SUPPORTED_CURRENCIES,
  ZAKAT_RATE,
  type Currency,
  type NisabBasis,
} from './constants'

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export type ZakatInput = {
  currency: string
  cash: string
  goldWeight: string
  goldKarat: string
  silverWeight: string
  silverKarat: string
  investments: string
  receivables: string
  liabilities: string
  goldPricePerGram: string
  silverPricePerGram: string
  nisabBasis: string
  hawlConfirmed: boolean
  valuationDateISO: string
}

export type ZakatLine = {
  id: string
  label: string
  labelAr: string
  value: string // decimal string with 2 decimals
  raw: string // unrounded decimal string
  included: boolean
  reason?: string
}

export type ZakatResult =
  | {
      ok: true
      status: 'liable' | 'below-nisab' | 'hawl-not-confirmed'
      nisabBasis: NisabBasis
      nisabValue: string
      nisabWeightGrams: string
      nisabGoldValue: string
      nisabSilverValue: string
      totalAssets: string
      liabilitiesDeducted: string
      zakatableBase: string
      zakatDue: string
      zakatDueGoldBasis: string
      zakatDueSilverBasis: string
      rate: string
      lines: ZakatLine[]
      meta: {
        currency: Currency
        methodologyVersion: string
        valuationDateISO: string
        hawlConfirmed: boolean
        hawlBasis: 'lunar'
        goldPrice: string
        silverPrice: string
        goldPurityFactor: string
        silverPurityFactor: string
      }
    }
  | {
      ok: false
      reason: 'invalid-input' | 'invalid-currency' | 'price-required' | 'invalid-nisab-basis' | 'invalid-date'
      details?: string
      field?: string
    }

function parseDecimalStrict(s: string): Decimal | null {
  const trimmed = s.trim()
  if (trimmed === '') return new Decimal(0)
  // Allow only digits, optional dot, up to maybe many decimals
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null
  try {
    const d = new Decimal(trimmed)
    if (!d.isFinite()) return null
    return d
  } catch {
    return null
  }
}

function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

function decimalsFor(currency: string): number {
  return CURRENCY_DECIMALS[currency] ?? 2
}

function formatDecimal(d: Decimal, currency: string): string {
  const dec = decimalsFor(currency)
  return d.toFixed(dec)
}

export function calculateZakat(input: ZakatInput): ZakatResult {
  const {
    currency,
    cash,
    goldWeight,
    goldKarat,
    silverWeight,
    silverKarat,
    investments,
    receivables,
    liabilities,
    goldPricePerGram,
    silverPricePerGram,
    nisabBasis,
    hawlConfirmed,
    valuationDateISO,
  } = input

  // Validate currency
  if (!SUPPORTED_CURRENCIES.includes(currency as Currency)) {
    return { ok: false, reason: 'invalid-currency', details: currency, field: 'currency' }
  }
  const curr = currency as Currency

  // Validate nisabBasis
  if (nisabBasis !== 'gold' && nisabBasis !== 'silver' && nisabBasis !== 'both') {
    return { ok: false, reason: 'invalid-nisab-basis', details: nisabBasis, field: 'nisabBasis' }
  }
  const basis = nisabBasis as NisabBasis

  // Validate date
  if (!isValidISODate(valuationDateISO)) {
    return { ok: false, reason: 'invalid-date', details: valuationDateISO, field: 'valuationDateISO' }
  }

  // Parse decimals
  const cashDec = parseDecimalStrict(cash)
  const goldWeightDec = parseDecimalStrict(goldWeight)
  const silverWeightDec = parseDecimalStrict(silverWeight)
  const investmentsDec = parseDecimalStrict(investments)
  const receivablesDec = parseDecimalStrict(receivables)
  const liabilitiesDec = parseDecimalStrict(liabilities)

  if (
    cashDec === null ||
    goldWeightDec === null ||
    silverWeightDec === null ||
    investmentsDec === null ||
    receivablesDec === null ||
    liabilitiesDec === null
  ) {
    return { ok: false, reason: 'invalid-input', details: 'amount fields must be non-negative numbers' }
  }

  for (const d of [cashDec, goldWeightDec, silverWeightDec, investmentsDec, receivablesDec, liabilitiesDec]) {
    if (d.isNegative()) return { ok: false, reason: 'invalid-input', details: 'negative amount', field: 'amount' }
  }

  // Purity factors
  const goldPurityStr = PURITY_TABLE[goldKarat] ?? null
  const silverPurityStr = PURITY_TABLE[silverKarat] ?? null
  if (!goldPurityStr || !silverPurityStr) {
    return { ok: false, reason: 'invalid-input', details: 'invalid karat', field: 'karat' }
  }
  const goldPurity = new Decimal(goldPurityStr)
  const silverPurity = new Decimal(silverPurityStr)

  // Gold/silver price parsing — required if weight >0 or nisab basis needs it
  const needGoldPrice = goldWeightDec.gt(0) || basis === 'gold' || basis === 'both'
  const needSilverPrice = silverWeightDec.gt(0) || basis === 'silver' || basis === 'both'

  let goldPriceDec: Decimal
  let silverPriceDec: Decimal

  if (needGoldPrice) {
    const t = goldPricePerGram.trim()
    if (t === '') return { ok: false, reason: 'price-required', details: 'gold price required', field: 'goldPricePerGram' }
    const p = parseDecimalStrict(t)
    if (p === null || p.lte(0)) return { ok: false, reason: 'invalid-input', details: 'gold price must be >0', field: 'goldPricePerGram' }
    goldPriceDec = p
  } else {
    const t = goldPricePerGram.trim()
    if (t !== '') {
      const p = parseDecimalStrict(t)
      if (p === null || p.lte(0)) return { ok: false, reason: 'invalid-input', details: 'gold price must be >0', field: 'goldPricePerGram' }
      goldPriceDec = p
    } else {
      goldPriceDec = new Decimal(0)
    }
  }

  if (needSilverPrice) {
    const t = silverPricePerGram.trim()
    if (t === '') return { ok: false, reason: 'price-required', details: 'silver price required', field: 'silverPricePerGram' }
    const p = parseDecimalStrict(t)
    if (p === null || p.lte(0)) return { ok: false, reason: 'invalid-input', details: 'silver price must be >0', field: 'silverPricePerGram' }
    silverPriceDec = p
  } else {
    const t = silverPricePerGram.trim()
    if (t !== '') {
      const p = parseDecimalStrict(t)
      if (p === null || p.lte(0)) return { ok: false, reason: 'invalid-input', details: 'silver price must be >0', field: 'silverPricePerGram' }
      silverPriceDec = p
    } else {
      silverPriceDec = new Decimal(0)
    }
  }

  // goldPriceDec / silverPriceDec are now guaranteed set in all branches above

  // Compute pure grams and values
  const pureGoldGrams = goldWeightDec.times(goldPurity)
  const pureSilverGrams = silverWeightDec.times(silverPurity)
  const goldValue = pureGoldGrams.times(goldPriceDec)
  const silverValue = pureSilverGrams.times(silverPriceDec)

  const totalAssets = cashDec.plus(goldValue).plus(silverValue).plus(investmentsDec).plus(receivablesDec)

  // Liabilities deducted (capped)
  const liabilitiesCapped = Decimal.min(liabilitiesDec, totalAssets)
  const zakatableBase = totalAssets.minus(liabilitiesCapped)

  // Nisab values
  const nisabGoldWeight = new Decimal(NISAB_GOLD_GRAMS)
  const nisabSilverWeight = new Decimal(NISAB_SILVER_GRAMS)
  const nisabGoldValue = nisabGoldWeight.times(goldPriceDec)
  const nisabSilverValue = nisabSilverWeight.times(silverPriceDec)

  let nisabValue: Decimal
  let nisabWeight: Decimal
  if (basis === 'gold') {
    nisabValue = nisabGoldValue
    nisabWeight = nisabGoldWeight
  } else if (basis === 'silver') {
    nisabValue = nisabSilverValue
    nisabWeight = nisabSilverWeight
  } else {
    // both — for primary comparison use gold, but compute both
    nisabValue = nisabGoldValue // primary for status; both shown separately
    nisabWeight = nisabGoldWeight
  }

  // Determine status
  let status: 'liable' | 'below-nisab' | 'hawl-not-confirmed'
  if (!hawlConfirmed) status = 'hawl-not-confirmed'
  else {
    // For 'both', liable if above either? But for primary status we check gold if both, and also indicate.
    // Roadmap says show both — we treat 'both' as liable if above *either*? Actually conservative: if above silver OR gold, liable under silver.
    // For status, if both: check if base >= silver => liable, else if >= gold => liable, else below.
    // We'll compute accordingly.
    if (basis === 'both') {
      const liable = zakatableBase.gte(nisabSilverValue) || zakatableBase.gte(nisabGoldValue)
      status = liable ? 'liable' : 'below-nisab'
    } else {
      status = zakatableBase.gte(nisabValue) ? 'liable' : 'below-nisab'
    }
  }

  // Zakat due
  const rate = new Decimal(ZAKAT_RATE)

  // Only due if liable and hawl confirmed (hawl-not-confirmed still computes but status flags)
  const shouldPay = hawlConfirmed && status === 'liable'
  const zakatDue = shouldPay ? zakatableBase.times(rate) : new Decimal(0)

  // For both, compute per-basis dues
  const zakatDueGoldBasis = basis === 'silver' ? new Decimal(0) : zakatableBase.gte(nisabGoldValue) && hawlConfirmed ? zakatableBase.times(rate) : new Decimal(0)
  const zakatDueSilverBasis = basis === 'gold' ? new Decimal(0) : zakatableBase.gte(nisabSilverValue) && hawlConfirmed ? zakatableBase.times(rate) : new Decimal(0)

  // Build lines trace
  const lines: ZakatLine[] = [
    {
      id: 'cash',
      label: 'Cash & bank',
      labelAr: 'النقد والرصيد البنكي',
      value: formatDecimal(cashDec, curr),
      raw: cashDec.toString(),
      included: true,
    },
    {
      id: 'gold',
      label: `Gold ${goldWeightDec.toString()}g × ${goldKarat}k (${pureGoldGrams.toFixed(2)}g pure) × ${goldPriceDec.toString()}/${curr}`,
      labelAr: `الذهب ${goldWeightDec.toString()}غ × عيار ${goldKarat} (${pureGoldGrams.toFixed(2)}غ خالص)`,
      value: formatDecimal(goldValue, curr),
      raw: goldValue.toString(),
      included: goldWeightDec.gt(0),
      reason: goldWeightDec.gt(0) ? undefined : 'no gold entered',
    },
    {
      id: 'silver',
      label: `Silver ${silverWeightDec.toString()}g × ${silverKarat}k (${pureSilverGrams.toFixed(2)}g pure)`,
      labelAr: `الفضة ${silverWeightDec.toString()}غ × عيار ${silverKarat}`,
      value: formatDecimal(silverValue, curr),
      raw: silverValue.toString(),
      included: silverWeightDec.gt(0),
    },
    {
      id: 'investments',
      label: 'Readily realizable investments',
      labelAr: 'استثمارات قابلة للتسييل',
      value: formatDecimal(investmentsDec, curr),
      raw: investmentsDec.toString(),
      included: investmentsDec.gt(0),
    },
    {
      id: 'receivables',
      label: 'Money owed to you (expected)',
      labelAr: 'ديون لك مرجوّة التحصيل',
      value: formatDecimal(receivablesDec, curr),
      raw: receivablesDec.toString(),
      included: receivablesDec.gt(0),
    },
    {
      id: 'liabilities',
      label: 'Short-term liabilities deducted',
      labelAr: 'ديون قصيرة الأجل مطروحة',
      value: `-${formatDecimal(liabilitiesCapped, curr)}`,
      raw: liabilitiesCapped.negated().toString(),
      included: liabilitiesCapped.gt(0),
    },
  ]

  return {
    ok: true,
    status: hawlConfirmed ? status : 'hawl-not-confirmed',
    nisabBasis: basis,
    nisabValue: formatDecimal(nisabValue, curr),
    nisabWeightGrams: nisabWeight.toString(),
    nisabGoldValue: formatDecimal(nisabGoldValue, curr),
    nisabSilverValue: formatDecimal(nisabSilverValue, curr),
    totalAssets: formatDecimal(totalAssets, curr),
    liabilitiesDeducted: formatDecimal(liabilitiesCapped, curr),
    zakatableBase: formatDecimal(zakatableBase, curr),
    zakatDue: formatDecimal(zakatDue, curr),
    zakatDueGoldBasis: formatDecimal(zakatDueGoldBasis, curr),
    zakatDueSilverBasis: formatDecimal(zakatDueSilverBasis, curr),
    rate: ZAKAT_RATE,
    lines,
    meta: {
      currency: curr,
      methodologyVersion: METHODOLOGY_VERSION,
      valuationDateISO,
      hawlConfirmed,
      hawlBasis: 'lunar',
      goldPrice: goldPriceDec.toString(),
      silverPrice: silverPriceDec.toString(),
      goldPurityFactor: goldPurity.toString(),
      silverPurityFactor: silverPurity.toString(),
    },
  }
}
