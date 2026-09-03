import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui'
import { AlertTriangleIcon, InfoIcon } from '@/components/icons'
import { convertGregorianToHijri, convertHijriToGregorian } from './engine'
import { HIJRI_MONTH_NAMES_AR, HIJRI_MONTH_NAMES_EN } from './constants'
import { formatHijriDate, formatNumber } from './format'
import { civilMonthLength } from './tabular'
import { umalquraMonthLength } from './umalqura'

const inputClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10 sm:text-sm sm:py-3'
const selectClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10 sm:text-sm sm:py-3'

const VARIANT_KEY = 'waqf-hijri-variant'
const TZ_KEY = 'waqf-hijri-tz'
const NUM_KEY = 'waqf-hijri-numbering'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseGregorianISO(s: string): { year: number; month: number; day: number } | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!y || !mo || !d) return null
  return { year: y, month: mo, day: d }
}

export default function HijriConverterTry() {
  const { t, locale } = useI18n()
  const variantTzId = useId()
  const gregDateId = useId()
  const hijriYearId = useId()
  const hijriMonthId = useId()
  const hijriDayId = useId()

  const [variant, setVariant] = useState<'islamic-umalqura' | 'islamic-civil'>('islamic-umalqura')
  const [timeZone, setTimeZone] = useState('Asia/Riyadh')
  const [numbering, setNumbering] = useState<'latn' | 'arab'>('latn')
  const [gregStr, setGregStr] = useState(todayISO())
  const [hijriYear, setHijriYear] = useState('1447')
  const [hijriMonth, setHijriMonth] = useState('9')
  const [hijriDay, setHijriDay] = useState('26')
  const [copied, setCopied] = useState<string | null>(null)
  const [copyFailed, setCopyFailed] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  // Load prefs
  useEffect(() => {
    try {
      const v = localStorage.getItem(VARIANT_KEY)
      if (v === 'islamic-civil' || v === 'islamic-umalqura') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
        setVariant(v)
      }
      const tz = localStorage.getItem(TZ_KEY)
      if (tz) setTimeZone(tz)
      const n = localStorage.getItem(NUM_KEY)
      if (n === 'latn' || n === 'arab') setNumbering(n)
      else if (locale === 'ar') setNumbering('arab')
      if (!tz) {
        const dtz = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (dtz) setTimeZone(dtz)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(VARIANT_KEY, variant)
    } catch {
      // ignore
    }
  }, [variant])
  useEffect(() => {
    try {
      localStorage.setItem(TZ_KEY, timeZone)
    } catch {
      // ignore
    }
  }, [timeZone])
  useEffect(() => {
    try {
      localStorage.setItem(NUM_KEY, numbering)
    } catch {
      // ignore
    }
  }, [numbering])

  // Shareable URL read
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const v = sp.get('variant')
      const g = sp.get('greg')
      const tz = sp.get('tz')
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL → state sync on mount
      if (v === 'islamic-civil' || v === 'islamic-umalqura') setVariant(v)
      if (g && /^\d{4}-\d{2}-\d{2}$/.test(g)) setGregStr(g)
      if (tz) setTimeZone(tz)
    } catch {
      // ignore
    }
  }, [])
  // Shareable URL write
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      sp.set('variant', variant)
      sp.set('greg', gregStr)
      sp.set('tz', timeZone)
      const url = `${window.location.pathname}?${sp.toString()}`
      window.history.replaceState(null, '', url)
    } catch {
      // ignore
    }
  }, [variant, gregStr, timeZone])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  const gregParsed = useMemo(() => parseGregorianISO(gregStr), [gregStr])

  const gregToHijri = useMemo(() => {
    if (!gregParsed) return null
    const r = convertGregorianToHijri({
      year: gregParsed.year,
      month: gregParsed.month,
      day: gregParsed.day,
      variant,
      timeZone,
    })
    return r
  }, [gregParsed, variant, timeZone])

  const hijriParsed = useMemo(() => {
    if (hijriYear.trim() === '' || hijriMonth.trim() === '' || hijriDay.trim() === '') return null
    const y = Number(hijriYear)
    const m = Number(hijriMonth)
    const d = Number(hijriDay)
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null
    return { year: y, month: m, day: d }
  }, [hijriYear, hijriMonth, hijriDay])

  const hijriToGreg = useMemo(() => {
    if (!hijriParsed) return null
    const r = convertHijriToGregorian({
      year: hijriParsed.year,
      month: hijriParsed.month,
      day: hijriParsed.day,
      variant,
      timeZone,
    })
    return r
  }, [hijriParsed, variant, timeZone])

  const currentMonthLength = useMemo(() => {
    if (!hijriParsed) return 30
    const y = hijriParsed.year
    const m = hijriParsed.month
    if (variant === 'islamic-umalqura') return umalquraMonthLength(y, m) || 30
    return civilMonthLength(y, m) || 30
  }, [hijriParsed, variant])

  const hijriDayError = hijriParsed ? hijriParsed.day > currentMonthLength || hijriParsed.day < 1 : false

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
    if (!gregToHijri || !gregToHijri.ok) return
    const payload = {
      gregorian: gregToHijri.gregorian,
      hijri: gregToHijri.hijri,
      variant: gregToHijri.variant,
      variantVersion: gregToHijri.variantVersion,
      jdn: gregToHijri.jdn,
      timeZone: gregToHijri.timeZone,
      generatedAt: new Date().toISOString(),
      note:
        locale === 'ar'
          ? 'تاريخ محسوب — قد يختلف يومًا أو يومين عن إعلان الرؤية المحلي. تقدير وليس فتوى.'
          : 'Calculated calendar — may differ 1-2 days from local moon-sighting announcement. Estimate, not a fatwa.',
      disclaimer:
        locale === 'ar'
          ? 'يتوفر التحويل بنوعين: أم القرى (السعودي) والمدني (الجدولي). النوع الظاهر في النتيجة هو المعتمد.'
          : 'Conversion is available in two variants: Umm al-Qura (Saudi, table) and Civil (tabular). The variant shown in the result is authoritative.',
    }
    copyText(JSON.stringify(payload, null, 2), 'json')
  }

  function handleCopyCsv() {
    if (!gregToHijri || !gregToHijri.ok) return
    const header = 'gregorian,hijri,variant,variantVersion,jdn,timeZone'
    const row = [
      `${gregToHijri.gregorian.year}-${String(gregToHijri.gregorian.month).padStart(2, '0')}-${String(gregToHijri.gregorian.day).padStart(2, '0')}`,
      `${gregToHijri.hijri.year}-${String(gregToHijri.hijri.month).padStart(2, '0')}-${String(gregToHijri.hijri.day).padStart(2, '0')}`,
      gregToHijri.variant,
      gregToHijri.variantVersion,
      gregToHijri.jdn,
      gregToHijri.timeZone,
    ].join(',')
    copyText(`${header}\n${row}`, 'csv')
  }

  function handleSwap() {
    // Swap Gregorian and Hijri values if both valid
    if (gregToHijri?.ok && hijriToGreg?.ok) {
      const g = hijriToGreg.gregorian
      setGregStr(`${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`)
      setHijriYear(String(gregToHijri.hijri.year))
      setHijriMonth(String(gregToHijri.hijri.month))
      setHijriDay(String(gregToHijri.hijri.day))
    } else if (gregToHijri?.ok) {
      setHijriYear(String(gregToHijri.hijri.year))
      setHijriMonth(String(gregToHijri.hijri.month))
      setHijriDay(String(gregToHijri.hijri.day))
    } else if (hijriToGreg?.ok) {
      const g = hijriToGreg.gregorian
      setGregStr(`${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`)
    }
  }

  const monthNames = locale === 'ar' ? HIJRI_MONTH_NAMES_AR : HIJRI_MONTH_NAMES_EN
  const gregHijriFormatted = useMemo(() => {
    if (!gregToHijri || !gregToHijri.ok) return null
    return formatHijriDate(gregToHijri.hijri, { locale, numbering, monthStyle: 'long' })
  }, [gregToHijri, locale, numbering])
  const hijriGregFormatted = useMemo(() => {
    if (!hijriToGreg || !hijriToGreg.ok) return null
    const g = hijriToGreg.gregorian
    return `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`
  }, [hijriToGreg])
  const weekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const weekdaysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  return (
    <div className="space-y-4">
      {/* Compact header — variant + numbering */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Variant">
          <button
            type="button"
            onClick={() => setVariant('islamic-umalqura')}
            aria-pressed={variant === 'islamic-umalqura'}
            aria-label={t.hijri.umalqura}
            data-testid="button-variant-umalqura"
            className={`min-h-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${variant === 'islamic-umalqura' ? 'bg-accent text-paper shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            {t.hijri.umalqura}
          </button>
          <button
            type="button"
            onClick={() => setVariant('islamic-civil')}
            aria-pressed={variant === 'islamic-civil'}
            aria-label={t.hijri.civil}
            data-testid="button-variant-civil"
            className={`min-h-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${variant === 'islamic-civil' ? 'bg-accent text-paper shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            {t.hijri.civil}
          </button>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent" data-testid="badge-variant">
          {variant === 'islamic-umalqura' ? `${t.hijri.umalqura} v1` : `${t.hijri.civil} v1`}
        </span>
        <div className="ms-auto flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Numbering">
          <button
            type="button"
            onClick={() => setNumbering('latn')}
            aria-pressed={numbering === 'latn'}
            data-testid="button-num-latn"
            className={`min-h-9 rounded-full px-3.5 py-1.5 text-sm font-semibold ${numbering === 'latn' ? 'bg-accent text-paper' : 'text-muted'}`}
          >
            123
          </button>
          <button
            type="button"
            onClick={() => setNumbering('arab')}
            aria-pressed={numbering === 'arab'}
            data-testid="button-num-arab"
            className={`min-h-9 rounded-full px-3.5 py-1.5 text-sm font-semibold ${numbering === 'arab' ? 'bg-accent text-paper' : 'text-muted'}`}
          >
            ١٢٣
          </button>
        </div>
      </div>

      {/* Compact warning */}
      <div className="flex gap-2.5 rounded-2xl border border-amber-300 bg-amber-50/80 px-3 py-2.5 backdrop-blur-xl" role="note" data-testid="banner-hijri-warning">
        <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="text-xs font-medium leading-4 text-amber-900">
          {t.hijri.calculatedNote}
          <span className="font-normal text-amber-800"> {t.hijri.variantAuthoritative}</span>
        </p>
      </div>

      {/* PRIMARY INPUTS HERO — most reachable */}
      <div className="rounded-[20px] border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="grid gap-4">
          {/* Gregorian */}
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- label htmlFor matches input id */}
          <label htmlFor={gregDateId} className="block">
            <span className="mb-1.5 flex items-center justify-between text-sm font-semibold">
              <span>{t.hijri.gregorianLabel}</span>
              <span className="text-xs font-normal text-muted">{t.hijri.gregorianToHijriTitle}</span>
            </span>
            <input
              id={gregDateId}
              type="date"
              value={gregStr}
              onChange={(e) => setGregStr(e.target.value)}
              className={inputClasses}
              dir="ltr"
              aria-invalid={!gregParsed}
              data-testid="input-greg-date"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setGregStr(todayISO())}
                className="min-h-9 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-accent/30"
                data-testid="button-greg-today"
              >
                {t.prayerTimes.today}
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() + 1)
                  setGregStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
                }}
                className="min-h-9 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-accent/30"
                data-testid="button-greg-tomorrow"
              >
                {t.prayerTimes.tomorrow}
              </button>
            </div>
          </label>

          {/* Swap divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line/60"></div>
            </div>
            <button
              type="button"
              onClick={handleSwap}
              aria-label={t.hijri.swapLabel}
              data-testid="button-hijri-swap"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-accent shadow-sm transition-colors hover:border-accent/40 hover:bg-accent-soft"
            >
              <span aria-hidden="true" className="text-lg leading-none">⇅</span>
            </button>
          </div>

          {/* Hijri */}
          <div className="rounded-2xl border border-line/60 bg-paper/60 p-4">
            <h3 className="flex items-center justify-between text-sm font-semibold">
              <span>{t.hijri.hijriLabel}</span>
              <span className="text-xs font-normal text-muted">
                {t.hijri.monthLength}: {formatNumber(currentMonthLength, numbering, locale)}
              </span>
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label htmlFor={hijriYearId} className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">{t.hijri.hijriYearLabel}</span>
                <input
                  id={hijriYearId}
                  type="text"
                  inputMode="numeric"
                  value={hijriYear}
                  onChange={(e) => setHijriYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  className={inputClasses}
                  dir="ltr"
                  placeholder="1447"
                  data-testid="input-hijri-year"
                />
              </label>
              <label htmlFor={hijriMonthId} className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">{t.hijri.monthLabel}</span>
                <select
                  id={hijriMonthId}
                  value={hijriMonth}
                  onChange={(e) => setHijriMonth(e.target.value)}
                  className={selectClasses}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  data-testid="select-hijri-month"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={String(idx + 1)}>
                      {formatNumber(idx + 1, numbering, locale)} — {name}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={hijriDayId} className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">{t.hijri.dayLabel}</span>
                <input
                  id={hijriDayId}
                  type="text"
                  inputMode="numeric"
                  value={hijriDay}
                  onChange={(e) => setHijriDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  className={inputClasses}
                  dir="ltr"
                  placeholder="1"
                  aria-invalid={hijriDayError}
                  data-testid="input-hijri-day"
                />
              </label>
            </div>
            {hijriDayError && (
              <p className="mt-2 text-xs font-medium text-danger" role="alert" data-testid="error-hijri-day">
                {t.hijri.dayExceeds.replace('{length}', formatNumber(currentMonthLength, numbering, locale))}
              </p>
            )}
            {/* Inline reverse preview */}
            <div className="mt-3">
              {hijriToGreg && hijriToGreg.ok ? (
                <div className="rounded-xl border border-accent/20 bg-accent-soft/40 px-4 py-3" data-testid="result-hijri-reverse">
                  <p className="eyebrow text-accent">{t.hijri.gregorianEquivalent}</p>
                  <p className="mt-1 font-mono-ui text-lg font-semibold" dir="ltr" data-testid="value-greg-output">
                    {hijriGregFormatted} • {variant === 'islamic-umalqura' ? t.hijri.umalqura : t.hijri.civil}
                  </p>
                </div>
              ) : hijriToGreg && !hijriToGreg.ok ? (
                <div
                  className="flex gap-2 rounded-xl border border-danger/40 bg-clay-soft/60 p-3"
                  role="alert"
                  data-testid={`status-hijri-reverse-${hijriToGreg.reason}`}
                >
                  <AlertTriangleIcon className="h-4 w-4 shrink-0 text-danger" />
                  <p className="text-xs font-bold leading-5 text-danger">{hijriToGreg.details ?? hijriToGreg.reason}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* UNIFIED RESULT — immediately below inputs */}
      {gregToHijri && gregToHijri.ok ? (
        <div className="glass-panel overflow-hidden rounded-[20px] border border-line/70 p-0" data-testid="result-hijri">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-accent-soft/40 px-4 py-3">
            <span className="text-sm font-semibold">{t.hijri.resultTitle}</span>
            <span className="font-mono-ui text-xs text-muted" dir="ltr">
              {gregStr} → {gregToHijri.hijri.year}-{String(gregToHijri.hijri.month).padStart(2, '0')}-{String(gregToHijri.hijri.day).padStart(2, '0')} • {gregToHijri.variant}
            </span>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow text-muted">{t.hijri.hijriLabel}</p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-tight" data-testid="value-hijri-output" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {gregHijriFormatted}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted" dir="ltr">
                {variant === 'islamic-umalqura' ? t.hijri.umalqura : t.hijri.civil} • {gregToHijri.variantVersion} • JDN {formatNumber(gregToHijri.jdn, numbering, locale)} •{' '}
                {locale === 'ar' ? weekdaysAr[gregToHijri.hijri.weekday] : weekdaysEn[gregToHijri.hijri.weekday]} • {t.hijri.monthLength}: {formatNumber(gregToHijri.hijri.monthLength, numbering, locale)}
              </p>
            </div>
            <div className="rounded-2xl border border-line/60 bg-surface/60 p-4">
              <p className="eyebrow text-muted">{t.hijri.detailsTitle}</p>
              <p className="mt-2 font-mono-ui text-xs leading-5 break-all" dir="ltr">
                {gregToHijri.variant} / {gregToHijri.variantVersion}
                <br />
                JDN {gregToHijri.jdn} • {gregToHijri.timeZone}
              </p>
              <p className="mt-2 text-[11px] leading-4 text-muted">{t.hijri.variantNote}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line/60 bg-surface/40 px-4 py-3">
            <Button variant="outline" onClick={handleCopyJson} className="px-4! py-2! text-xs" data-testid="button-hijri-copy-json">
              {copied === 'json' ? `✓ ${t.hijri.copied}` : t.hijri.copyJson}
            </Button>
            <Button variant="outline" onClick={handleCopyCsv} className="px-4! py-2! text-xs" data-testid="button-hijri-copy-csv">
              {copied === 'csv' ? `✓ ${t.hijri.copied}` : t.hijri.copyCsv}
            </Button>
          </div>
          {copyFailed && (
            <p className="px-4 pb-3 text-xs font-medium text-danger" role="alert">
              {t.hijri.copyFailed}
            </p>
          )}
        </div>
      ) : gregToHijri && !gregToHijri.ok ? (
        <div
          className="flex gap-3 rounded-2xl border border-danger/40 bg-clay-soft/80 p-4 backdrop-blur-xl"
          role="alert"
          data-testid={`status-hijri-${gregToHijri.reason}`}
        >
          <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-xs font-bold leading-5 text-danger">
              {gregToHijri.reason === 'out-of-range'
                ? t.hijri.outOfRange
                : gregToHijri.reason === 'invalid-timezone'
                  ? t.prayerTimes.invalidTimezone
                  : gregToHijri.details ?? gregToHijri.reason}
            </p>
            {gregToHijri.reason === 'out-of-range' && variant === 'islamic-umalqura' && (
              <p className="mt-1 text-[11px] leading-4 text-danger/80">{t.hijri.tryCivilHint}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-2xl border border-line/60 bg-surface/70 p-4 backdrop-blur-md" role="status">
          <InfoIcon className="h-5 w-5 shrink-0 text-muted" />
          <p className="text-xs leading-5 text-muted">{t.hijri.enterValidGregorian}</p>
        </div>
      )}

      {/* Quick actions for Hijri→Gregorian */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (gregToHijri && gregToHijri.ok) {
              setHijriYear(String(gregToHijri.hijri.year))
              setHijriMonth(String(gregToHijri.hijri.month))
              setHijriDay(String(gregToHijri.hijri.day))
            }
          }}
          className="px-4! py-2! text-xs"
          data-testid="button-hijri-use-forward"
        >
          {t.hijri.useForward}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (hijriToGreg && hijriToGreg.ok) {
              const g = hijriToGreg.gregorian
              setGregStr(`${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`)
            }
          }}
          className="px-4! py-2! text-xs"
          data-testid="button-hijri-use-reverse"
        >
          {t.hijri.applyToGregorian}
        </Button>
      </div>

      {/* Advanced — collapsed, not competing for reach */}
      <details className="group rounded-xl border border-line/60 bg-surface/50" data-testid="details-tz">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold">
          {t.hijri.tzDisplayTitle} <span className="font-normal text-muted">— {timeZone}</span>
          <span className="ms-2 text-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-line/60 p-4">
          <label htmlFor={variantTzId} className="block text-sm">
            <span className="mb-1.5 block font-medium">{t.prayerTimes.timezoneLabel}</span>
            <input
              id={variantTzId}
              type="text"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              placeholder={t.prayerTimes.timezonePlaceholder}
              className={inputClasses}
              dir="ltr"
              list="hijri-tz-list"
              autoComplete="off"
              spellCheck={false}
              data-testid="input-hijri-tz"
            />
            <datalist id="hijri-tz-list">
              <option value="Asia/Riyadh" />
              <option value="Asia/Dubai" />
              <option value="Asia/Karachi" />
              <option value="Africa/Cairo" />
              <option value="Europe/London" />
              <option value="Europe/Istanbul" />
              <option value="America/New_York" />
              <option value="Asia/Jakarta" />
              <option value="Asia/Kuala_Lumpur" />
            </datalist>
            <p className="mt-1 text-[11px] leading-4 text-muted">{t.hijri.dayStartNote}</p>
          </label>
        </div>
      </details>

      <div className="flex gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 backdrop-blur-sm" role="note">
        <InfoIcon className="h-5 w-5 shrink-0 text-amber-700" />
        <p className="text-xs font-medium leading-5 text-amber-900">
          {t.hijri.processingNote} {t.hijri.processingNoteExtended}
        </p>
      </div>
    </div>
  )
}
