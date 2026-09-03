import { describe, expect, it } from 'vitest'
import Decimal from 'decimal.js'
import { calculateZakat } from './engine'

describe('zakat calculator - decimal and nisab', () => {
  it('below nisab returns below-nisab', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '10000',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.status).toBe('below-nisab')
      expect(r.zakatDue).toBe('0.00')
      expect(r.nisabGoldValue).toBe('21250.00')
    }
  })

  it('at nisab is liable (inclusive)', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '21250',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.status).toBe('liable')
      expect(r.zakatDue).toBe('531.25')
    }
  })

  it('decimal 0.1 + 0.2 no drift', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '0.10',
      goldWeight: '0.20',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '1',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      // gold 0.2g pure @1 =0.20, plus cash 0.10 =0.30
      expect(r.totalAssets).toBe('0.30')
    }
  })

  it('purity conversion 22k', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '',
      goldWeight: '100',
      goldKarat: '22',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      // pure 91.666..., value 22916.666... -> 22916.67
      const val = new Decimal(r.totalAssets)
      expect(val.toFixed(2)).toBe('22916.67')
    }
  })

  it('negative amount invalid', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '-100',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid-input')
  })

  it('price required when weight entered', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '',
      goldWeight: '10',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('price-required')
  })

  it('liabilities capped at assets', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '3000',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '5000',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.zakatableBase).toBe('0.00')
      expect(r.status).toBe('below-nisab')
    }
  })

  it('hawl not confirmed flag', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '50000',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: false,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.status).toBe('hawl-not-confirmed')
      expect(r.zakatDue).toBe('0.00')
    }
  })

  it('both bases comparison', () => {
    // Gold nisab 85*250=21250, Silver 595*3=1785, cash 5000 => above silver, below gold
    const r = calculateZakat({
      currency: 'SAR',
      cash: '5000',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'both',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.nisabGoldValue).toBe('21250.00')
      expect(r.nisabSilverValue).toBe('1785.00')
      expect(r.status).toBe('liable') // via silver
      expect(r.zakatDueSilverBasis).toBe('125.00')
      expect(r.zakatDueGoldBasis).toBe('0.00')
    }
  })

  it('currency decimals KWD 3', () => {
    const r = calculateZakat({
      currency: 'KWD',
      cash: '1000',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '10',
      silverPricePerGram: '1',
      nisabBasis: 'silver',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      // nisab silver 595*1=595, base 1000 => zakat 25.000
      expect(r.zakatDue).toBe('25.000')
    }
  })

  it('invalid currency', () => {
    const r = calculateZakat({
      currency: 'XYZ',
      cash: '1000',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-03-15',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid-currency')
  })

  it('invalid date', () => {
    const r = calculateZakat({
      currency: 'SAR',
      cash: '1000',
      goldWeight: '',
      goldKarat: '24',
      silverWeight: '',
      silverKarat: '24',
      investments: '',
      receivables: '',
      liabilities: '',
      goldPricePerGram: '250',
      silverPricePerGram: '3',
      nisabBasis: 'gold',
      hawlConfirmed: true,
      valuationDateISO: '2026-13-01',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid-date')
  })
})
