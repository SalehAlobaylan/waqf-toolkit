/* eslint-disable react-hooks/set-state-in-effect -- initial load from localStorage is intentional */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui'
import { AlertTriangleIcon, InfoIcon } from '@/components/icons'
import { calculateZakat } from './engine'
import { CURRENCY_DECIMALS, SUPPORTED_CURRENCIES } from './constants'

const inputClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10 sm:py-3 sm:text-sm'
const selectClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10 sm:py-3 sm:text-sm'

const DRAFT_KEY = 'waqf-zakat-draft'
const AUTOSAVE_KEY = 'waqf-zakat-autosave'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sanitizeDecimalInput(v: string): string {
  // Keep digits, single dot, leading minus for validation (engine will reject negatives visibly)
  // eslint-disable-next-line no-useless-escape
  let s = v.replace(/[^0-9.\-]/g, '')
  // Only one dot
  s = s.replace(/(\..*)\./g, '$1')
  // Only leading minus
  s = s.replace(/(?!^)-/g, '')
  return s
}

function formatCurrency(amountStr: string, currency: string, locale: 'en' | 'ar'): string {
  const dec = CURRENCY_DECIMALS[currency] ?? 2
  const num = Number(amountStr)
  if (!Number.isFinite(num)) return `${amountStr} ${currency}`
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(num)
  } catch {
    return `${Number(num).toFixed(dec)} ${currency}`
  }
}

export default function ZakatCalculatorTry() {
  const { t, locale } = useI18n()
  const currencyId = useId()
  const dateId = useId()
  const cashId = useId()
  const goldWeightId = useId()
  const goldPriceId = useId()
  const silverWeightId = useId()
  const silverPriceId = useId()
  const investmentsId = useId()
  const receivablesId = useId()
  const liabilitiesId = useId()

  const [currency, setCurrency] = useState('SAR')
  const [valuationDate, setValuationDate] = useState(todayISO())
  const [cash, setCash] = useState('')
  const [goldWeight, setGoldWeight] = useState('')
  const [goldKarat, setGoldKarat] = useState('24')
  const [goldPrice, setGoldPrice] = useState('250')
  const [silverWeight, setSilverWeight] = useState('')
  const [silverKarat, setSilverKarat] = useState('24')
  const [silverPrice, setSilverPrice] = useState('3')
  const [investments, setInvestments] = useState('')
  const [receivables, setReceivables] = useState('')
  const [liabilities, setLiabilities] = useState('')
  const [nisabBasis, setNisabBasis] = useState<'gold' | 'silver' | 'both'>('gold')
  const [hawlConfirmed, setHawlConfirmed] = useState(false)
  const [autosave] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [copyFailed, setCopyFailed] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  // Load draft — by default use local storage (autosave always on)
  useEffect(() => {
    try {
      const a = localStorage.getItem(AUTOSAVE_KEY)
      const enabled = a !== '0'
      const raw = localStorage.getItem(DRAFT_KEY)
      if (enabled && raw) {
        const draft = JSON.parse(raw) as Record<string, string>
        if (draft.currency) setCurrency(draft.currency)
        if (draft.valuationDate) setValuationDate(draft.valuationDate)
        if (draft.cash !== undefined) setCash(draft.cash)
        if (draft.goldWeight !== undefined) setGoldWeight(draft.goldWeight)
        if (draft.goldKarat) setGoldKarat(draft.goldKarat)
        if (draft.goldPrice) setGoldPrice(draft.goldPrice)
        if (draft.silverWeight !== undefined) setSilverWeight(draft.silverWeight)
        if (draft.silverKarat) setSilverKarat(draft.silverKarat)
        if (draft.silverPrice) setSilverPrice(draft.silverPrice)
        if (draft.investments !== undefined) setInvestments(draft.investments)
        if (draft.receivables !== undefined) setReceivables(draft.receivables)
        if (draft.liabilities !== undefined) setLiabilities(draft.liabilities)
        if (draft.nisabBasis === 'gold' || draft.nisabBasis === 'silver' || draft.nisabBasis === 'both')
          setNisabBasis(draft.nisabBasis)
        if (draft.hawlConfirmed) setHawlConfirmed(draft.hawlConfirmed === '1')
        if (draft.silverWeight || draft.investments || draft.receivables || draft.liabilities || draft.nisabBasis === 'silver' || draft.nisabBasis === 'both') {
          setAdvancedOpen(true)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, autosave ? '1' : '0')
      if (!autosave) {
        localStorage.removeItem(DRAFT_KEY)
      }
    } catch {
      // ignore
    }
  }, [autosave])

  // Autosave draft
  useEffect(() => {
    if (!autosave) return
    try {
      const draft = {
        currency,
        valuationDate,
        cash,
        goldWeight,
        goldKarat,
        goldPrice,
        silverWeight,
        silverKarat,
        silverPrice,
        investments,
        receivables,
        liabilities,
        nisabBasis,
        hawlConfirmed: hawlConfirmed ? '1' : '0',
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore
    }
  }, [autosave, currency, valuationDate, cash, goldWeight, goldKarat, goldPrice, silverWeight, silverKarat, silverPrice, investments, receivables, liabilities, nisabBasis, hawlConfirmed])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
    setCash('')
    setGoldWeight('')
    setSilverWeight('')
    setInvestments('')
    setReceivables('')
    setLiabilities('')
    setHawlConfirmed(false)
    // Focus cash for next entry
    document.getElementById(cashId)?.focus()
  }

  const result = useMemo(() => {
    return calculateZakat({
      currency,
      cash,
      goldWeight,
      goldKarat,
      silverWeight,
      silverKarat,
      investments,
      receivables,
      liabilities,
      goldPricePerGram: goldPrice,
      silverPricePerGram: silverPrice,
      nisabBasis,
      hawlConfirmed,
      valuationDateISO: valuationDate,
    })
  }, [currency, cash, goldWeight, goldKarat, goldPrice, silverWeight, silverKarat, silverPrice, investments, receivables, liabilities, nisabBasis, hawlConfirmed, valuationDate])

  async function copyText(text: string, key: string) {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
      setCopyFailed(false)
      setCopied(key)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
      setCopyFailed(true)
    }
  }

  function handleCopyJson() {
    if (!result.ok) return
    const payload = {
      currency: result.meta.currency,
      valuationDate: result.meta.valuationDateISO,
      nisabBasis: result.nisabBasis,
      nisabWeightGrams: result.nisabWeightGrams,
      nisabGoldValue: result.nisabGoldValue,
      nisabSilverValue: result.nisabSilverValue,
      totalAssets: result.totalAssets,
      zakatableBase: result.zakatableBase,
      zakatDue: result.zakatDue,
      zakatDueGoldBasis: result.zakatDueGoldBasis,
      zakatDueSilverBasis: result.zakatDueSilverBasis,
      rate: result.rate,
      lines: result.lines,
      meta: result.meta,
      status: result.status,
      generatedAt: new Date().toISOString(),
      methodologyVersion: result.meta.methodologyVersion,
      disclaimer: t.zakat.disclaimer,
      note: t.zakat.disclaimer,
    }
    copyText(JSON.stringify(payload, null, 2), 'json')
  }

  function handleCopyCsv() {
    if (!result.ok) return
    const header = 'currency,valuationDate,nisabBasis,totalAssets,zakatableBase,zakatDue,rate,status,methodologyVersion,disclaimer'
    const disclaimer = `"${t.zakat.disclaimer.replace(/"/g, '""')}"`
    const row = [result.meta.currency, result.meta.valuationDateISO, result.nisabBasis, result.totalAssets, result.zakatableBase, result.zakatDue, result.rate, result.status, result.meta.methodologyVersion, disclaimer].join(',')
    copyText(`${header}\n${row}`, 'csv')
  }

  const hasSecondaryValues = silverWeight !== '' || investments !== '' || receivables !== '' || liabilities !== '' || nisabBasis === 'silver' || nisabBasis === 'both'

  return (
    <div className="space-y-4">
      {/* Sticky compact summary — always reachable, not pushing inputs */}
      <div
        className="sticky top-0 z-20 -mx-4 -mt-4 border-b border-line/60 bg-paper/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:mt-0"
        data-testid="bar-zakat-summary"
        aria-live="polite"
      >
        {result.ok ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${result.status === 'liable' ? 'bg-accent text-paper' : result.status === 'below-nisab' ? 'bg-amber-100 text-amber-900' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}
                  data-testid="badge-zakat-status"
                >
                  {result.status === 'liable' ? t.zakat.liable : result.status === 'below-nisab' ? t.zakat.belowNisab : t.zakat.hawlNotConfirmed}
                </span>
                <span className="hidden sm:inline font-normal text-muted">
                  {result.nisabBasis} • {result.meta.methodologyVersion}
                </span>
              </p>
              <p className="mt-1 truncate font-display text-lg font-semibold leading-none" dir="ltr" data-testid="value-zakat-due-compact">
                {formatCurrency(result.zakatDue, result.meta.currency, locale)}
                <span className="ms-1 text-xs font-medium text-muted">{result.meta.currency}</span>
              </p>
            </div>
            <div className="text-end">
              <p className="text-[11px] font-medium text-muted">{t.zakat.baseShort}</p>
              <p className="font-mono-ui text-sm font-semibold" dir="ltr">
                {formatCurrency(result.zakatableBase, result.meta.currency, locale)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1" role="alert">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs font-bold leading-4 text-amber-900">
              {result.reason === 'price-required' ? t.zakat.metalPriceRequired : result.reason === 'invalid-input' ? t.zakat.checkNumbers : result.reason}
            </p>
            <span className="ms-auto text-[11px] text-muted">{result.details ?? ''}</span>
          </div>
        )}
      </div>

      {/* PRIMARY INPUTS — most reachable, no scroll needed */}
      <div className="rounded-[20px] border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{t.zakat.primaryAssetsTitle}</h3>
          <button
            type="button"
            onClick={clearDraft}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:border-accent/30 hover:text-accent"
            data-testid="button-clear-top"
          >
            {t.zakat.clearDraft}
          </button>
        </div>
        <p className="mt-2 text-xs leading-4 text-muted">{t.zakat.autosaveNote}</p>

        {/* Cash — full width primary */}
        <label htmlFor={cashId} className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold">{t.zakat.cashLabel}</span>
          <input
            id={cashId}
            type="text"
            inputMode="decimal"
            value={cash}
            onChange={(e) => setCash(sanitizeDecimalInput(e.target.value))}
            placeholder="0"
            className={inputClasses}
            dir="ltr"
            enterKeyHint="next"
            data-testid="input-cash"
            aria-describedby={result && !result.ok && result.reason === 'invalid-input' ? 'error-zakat' : undefined}
          />
        </label>

        {/* Gold — prominent */}
        <div className="mt-4 rounded-xl border border-line/60 bg-paper p-4">
          <p className="text-xs font-bold tracking-wide text-ink">{t.zakat.goldHighlight}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label htmlFor={goldWeightId} className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.weightLabel}</span>
              <input
                id={goldWeightId}
                type="text"
                inputMode="decimal"
                value={goldWeight}
                onChange={(e) => setGoldWeight(sanitizeDecimalInput(e.target.value))}
                placeholder="0"
                className={inputClasses}
                dir="ltr"
                enterKeyHint="next"
                data-testid="input-gold-weight"
              />
            </label>
            <label htmlFor="gold-karat" className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.purityLabel}</span>
              <select id="gold-karat" value={goldKarat} onChange={(e) => setGoldKarat(e.target.value)} className={selectClasses} dir="ltr" data-testid="select-gold-karat">
                <option value="24">24k (1)</option>
                <option value="22">22k (0.9167)</option>
                <option value="21">21k (0.875)</option>
                <option value="18">18k (0.75)</option>
              </select>
            </label>
            <label htmlFor={goldPriceId} className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.priceLabel}</span>
              <input
                id={goldPriceId}
                type="text"
                inputMode="decimal"
                value={goldPrice}
                onChange={(e) => setGoldPrice(sanitizeDecimalInput(e.target.value))}
                placeholder="250"
                className={inputClasses}
                dir="ltr"
                enterKeyHint="next"
                data-testid="input-gold-price"
              />
            </label>
          </div>
        </div>

        {/* Nisab basis — directly under gold, high impact */}
        <div className="mt-4">
          <span className="mb-1.5 block text-sm font-semibold">{t.zakat.nisabBasisLabel}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.zakat.nisabBasisLabel}>
            {(['gold', 'silver', 'both'] as const).map((basis) => (
              <button
                key={basis}
                type="button"
                onClick={() => {
                  setNisabBasis(basis)
                  if (basis === 'silver' || basis === 'both') setAdvancedOpen(true)
                }}
                aria-pressed={nisabBasis === basis}
                data-testid={`button-nisab-${basis}`}
                className={`min-h-10 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${nisabBasis === basis ? 'bg-accent text-paper border-accent shadow-sm' : 'border-line bg-surface text-muted hover:border-accent/30'}`}
              >
                {basis === 'gold' ? t.zakat.nisabGold : basis === 'silver' ? t.zakat.nisabSilver : t.zakat.nisabBoth}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-muted">{t.zakat.hawlHint}</p>
        </div>

        {/* Hawl — gate, directly under nisab */}
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- label wraps checkbox via htmlFor + nesting */}
        <label htmlFor="zakat-hawl" className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <input
            id="zakat-hawl"
            type="checkbox"
            checked={hawlConfirmed}
            onChange={(e) => setHawlConfirmed(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-line text-accent focus:ring-accent"
            data-testid="checkbox-hawl"
            aria-describedby="hawl-help"
          />
          <span className="text-sm leading-5">
            <span className="font-semibold">{t.zakat.hawlLabel}</span>
            <span id="hawl-help" className="block text-xs font-normal text-muted">
              {t.zakat.hawlHint}
            </span>
          </span>
        </label>

        {/* Inline validation inside primary — not hidden at top */}
        {result && !result.ok && (
          <div id="error-zakat" className="rounded-xl border border-amber-300 bg-amber-50/60 px-4 py-3" role="alert" data-testid={`status-${result.reason}`}>
            <p className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangleIcon className="h-4 w-4" />
              {result.reason === 'price-required' ? t.zakat.priceRequired : t.zakat.invalidInput}
              <span className="font-normal text-amber-800">{result.details ? `— ${result.details}` : ''}</span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" onClick={clearDraft} className="min-h-9 px-4! py-2.5! text-xs" data-testid="button-clear">
            {t.zakat.clearDraft}
          </Button>
          {!advancedOpen && hasSecondaryValues && (
            <span className="self-center text-xs text-muted">{t.zakat.extraValuesHint}</span>
          )}
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="ms-auto rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted hover:border-accent/30"
            data-testid="button-toggle-advanced"
            aria-expanded={advancedOpen}
          >
            {advancedOpen ? t.zakat.advancedHide : t.zakat.advancedShow}
          </button>
        </div>
      </div>

      {/* DETAILED RESULT — directly below primary, not pushing it */}
      {result.ok ? (
        <div className="space-y-3" data-testid="result-zakat">
          <div className="glass-panel overflow-hidden rounded-[20px] border border-line/70 p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-accent-soft/40 px-4 py-3">
              <span className="text-sm font-semibold">{t.zakat.breakdownTitle}</span>
              <span className="font-mono-ui text-xs text-muted" dir="ltr">
                {result.nisabBasis} • {result.meta.methodologyVersion} • {result.meta.valuationDateISO}
              </span>
            </div>

            <div className="p-6">
              <p className="eyebrow text-muted">{t.zakat.estimatedZakat}</p>
              <p className="mt-1 font-display text-4xl font-semibold tracking-tight" dir="ltr" data-testid="value-zakat-due">
                {formatCurrency(result.zakatDue, result.meta.currency, locale)} <span className="text-lg font-medium text-muted">{result.meta.currency}</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {t.zakat.rateNote} • {t.zakat.baseShort} {formatCurrency(result.zakatableBase, result.meta.currency, locale)}
              </p>
              {result.nisabBasis === 'both' && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-line/60 bg-surface/50 p-3">
                    <p className="eyebrow text-muted">{t.zakat.nisabGold}</p>
                    <p className="mt-1 font-mono-ui text-sm font-semibold" data-testid="value-nisab-gold">
                      {formatCurrency(result.nisabGoldValue, result.meta.currency, locale)} → {formatCurrency(result.zakatDueGoldBasis, result.meta.currency, locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line/60 bg-surface/50 p-3">
                    <p className="eyebrow text-muted">{t.zakat.nisabSilver}</p>
                    <p className="mt-1 font-mono-ui text-sm font-semibold" data-testid="value-nisab-silver">
                      {formatCurrency(result.nisabSilverValue, result.meta.currency, locale)} → {formatCurrency(result.zakatDueSilverBasis, result.meta.currency, locale)}
                    </p>
                  </div>
                </div>
              )}
              {result.nisabBasis !== 'both' && (
                <p className="mt-2 font-mono-ui text-xs text-muted" data-testid="value-nisab-single">
                  {t.zakat.nisabBasisLabel} ({result.nisabBasis} {result.nisabWeightGrams}g): {formatCurrency(result.nisabValue, result.meta.currency, locale)}
                </p>
              )}
            </div>

            <div className="border-y border-line/60 bg-surface/30">
              <table className="w-full text-xs" data-testid="table-zakat-lines">
                <thead>
                  <tr className="border-b border-line/40 text-start text-muted">
                    <th className="px-4 py-2 text-start font-semibold">{t.zakat.tableLine}</th>
                    <th className="px-4 py-2 text-end font-semibold">{t.zakat.tableAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lines.map((line) => (
                    <tr key={line.id} className="border-b border-line/20 last:border-0">
                      <td className="px-4 py-2.5 text-ink">{locale === 'ar' ? line.labelAr : line.label}</td>
                      <td className="px-4 py-2.5 text-end font-mono-ui font-medium" dir="ltr">
                        {formatCurrency(line.value.replace('-', ''), result.meta.currency, locale)}
                        {line.value.startsWith('-') ? ' −' : ''}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-accent-soft/30 font-semibold">
                    <td className="px-4 py-3 text-start">{t.zakat.zakatableBase}</td>
                    <td className="px-4 py-3 text-end font-mono-ui" dir="ltr" data-testid="value-zakat-base">
                      {formatCurrency(result.zakatableBase, result.meta.currency, locale)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 bg-surface/40 px-4 py-3">
              <Button variant="outline" onClick={handleCopyJson} className="px-4! py-2! text-xs" data-testid="button-zakat-copy-json">
                {copied === 'json' ? `✓ ${t.zakat.copied}` : t.zakat.copyJson}
              </Button>
              <Button variant="outline" onClick={handleCopyCsv} className="px-4! py-2! text-xs" data-testid="button-zakat-copy-csv">
                {copied === 'csv' ? `✓ ${t.zakat.copied}` : t.zakat.copyCsv}
              </Button>
            </div>
            {copyFailed && (
              <p className="px-4 pb-3 text-xs font-medium text-danger" role="alert" aria-live="polite">
                {t.zakat.copyFailed}
              </p>
            )}
            <div className="flex gap-3 border-t border-amber-200/60 bg-amber-50/60 px-4 py-3 backdrop-blur-sm">
              <InfoIcon className="h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-xs font-medium leading-5 text-amber-900">{t.zakat.disclaimer}</p>
            </div>
          </div>

          {result.status === 'hawl-not-confirmed' && (
            <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 backdrop-blur-xl" role="alert" data-testid="status-hawl">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-xs font-bold leading-5 text-amber-900">{t.zakat.hawlWarning}</p>
            </div>
          )}
          {result.status === 'below-nisab' && (
            <div className="flex gap-3 rounded-2xl border border-line/60 bg-surface/70 p-4" role="status" data-testid="status-below">
              <InfoIcon className="h-5 w-5 shrink-0 text-muted" />
              <p className="text-xs leading-5 text-muted">
                {t.zakat.belowNisab} — {t.zakat.hawlWarning.includes('النتيجة') ? '' : ''} {t.zakat.belowNisab === 'Below nisab' ? 'Nisab:' : 'النصاب:'}{' '}
                <span className="font-semibold">{formatCurrency(result.nisabValue, result.meta.currency, locale)}</span>
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* ADVANCED — collapsed by default, progressive disclosure */}
      <details
        className="group rounded-xl border border-line/60 bg-surface/50"
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
        data-testid="details-advanced"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold">
          <span>{t.zakat.advancedTitle}</span>
          <span className="flex items-center gap-2">
            {hasSecondaryValues && !advancedOpen && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent">{t.zakat.hasValues}</span>}
            <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
          </span>
        </summary>
        <div className="space-y-4 border-t border-line/60 p-4">
          {/* Silver */}
          <div className="rounded-xl border border-line/60 bg-surface p-4">
            <p className="text-xs font-semibold">{t.zakat.silverOptional}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label htmlFor={silverWeightId} className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.weightLabel}</span>
                <input
                  id={silverWeightId}
                  type="text"
                  inputMode="decimal"
                  value={silverWeight}
                  onChange={(e) => setSilverWeight(sanitizeDecimalInput(e.target.value))}
                  placeholder="0"
                  className={inputClasses}
                  dir="ltr"
                  data-testid="input-silver-weight"
                />
              </label>
              <label htmlFor="silver-karat" className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.purityLabel}</span>
                <select id="silver-karat" value={silverKarat} onChange={(e) => setSilverKarat(e.target.value)} className={selectClasses} dir="ltr" data-testid="select-silver-karat">
                  <option value="24">24k (1)</option>
                  <option value="22">22k (0.9167)</option>
                  <option value="21">21k (0.875)</option>
                  <option value="18">18k (0.75)</option>
                </select>
              </label>
              <label htmlFor={silverPriceId} className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.priceLabel}</span>
                <input
                  id={silverPriceId}
                  type="text"
                  inputMode="decimal"
                  value={silverPrice}
                  onChange={(e) => setSilverPrice(sanitizeDecimalInput(e.target.value))}
                  placeholder="3"
                  className={inputClasses}
                  dir="ltr"
                  data-testid="input-silver-price"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor={investmentsId} className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.investmentsLabel}</span>
              <input
                id={investmentsId}
                type="text"
                inputMode="decimal"
                value={investments}
                onChange={(e) => setInvestments(sanitizeDecimalInput(e.target.value))}
                placeholder="0"
                className={inputClasses}
                dir="ltr"
                data-testid="input-investments"
              />
            </label>
            <label htmlFor={receivablesId} className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.receivablesLabel}</span>
              <input
                id={receivablesId}
                type="text"
                inputMode="decimal"
                value={receivables}
                onChange={(e) => setReceivables(sanitizeDecimalInput(e.target.value))}
                placeholder="0"
                className={inputClasses}
                dir="ltr"
                data-testid="input-receivables"
              />
            </label>
          </div>

          <label htmlFor={liabilitiesId} className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.liabilitiesLabel}</span>
            <input
              id={liabilitiesId}
              type="text"
              inputMode="decimal"
              value={liabilities}
              onChange={(e) => setLiabilities(sanitizeDecimalInput(e.target.value))}
              placeholder="0"
              className={inputClasses}
              dir="ltr"
              data-testid="input-liabilities"
            />
          </label>

          <div className="grid gap-3 rounded-xl border border-line/40 bg-paper/50 p-3 sm:grid-cols-2">
            <label htmlFor={currencyId} className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.currencyLabel}</span>
              <select
                id={currencyId}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={selectClasses}
                dir="ltr"
                data-testid="select-currency"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} — {CURRENCY_DECIMALS[c] ?? 2}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={dateId} className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{t.zakat.valuationDateLabel}</span>
              <input
                id={dateId}
                type="date"
                value={valuationDate}
                onChange={(e) => setValuationDate(e.target.value)}
                className={inputClasses}
                dir="ltr"
                data-testid="input-valuation-date"
              />
            </label>
          </div>
        </div>
      </details>

      <details className="group rounded-xl border border-line/60 bg-surface/50">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold">
          {t.zakat.whatWeDont} <span className="ms-2 text-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-line/60 p-4 text-xs leading-5 text-muted">
          <p>{t.zakat.excludedBody}</p>
          <p className="mt-2">{t.zakat.hawlHint}</p>
        </div>
      </details>

      <div className="flex gap-3 rounded-2xl border border-line/60 bg-surface/70 p-4 backdrop-blur-sm">
        <InfoIcon className="h-5 w-5 shrink-0 text-muted" />
        <p className="text-xs font-medium leading-5 text-muted">{t.zakat.processingNote}</p>
      </div>
    </div>
  )
}
