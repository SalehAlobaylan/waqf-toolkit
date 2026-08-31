import { useEffect, useId, useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui'
import { AlertTriangleIcon, ArrowRightIcon, InfoIcon } from '@/components/icons'
import { calculatePrayerTimes, type PrayerName } from './engine'
import { PRAYER_METHODS, DEFAULT_METHOD_ID, DEFAULT_ASR, DEFAULT_HIGH_LAT, getMethod } from './methods'
import { CITIES, getCity } from './cities'

const inputClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10'
const selectClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10'

const PRAYER_ORDER: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function getNowMinutes(timeZone: string): number | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false })
    const parts = fmt.formatToParts(new Date())
    const h = Number(parts.find((p) => p.type === 'hour')?.value)
    const m = Number(parts.find((p) => p.type === 'minute')?.value)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null
    return h * 60 + m
  } catch {
    return null
  }
}

function getNextPrayer(times: Record<PrayerName, string>, timeZone: string): { name: PrayerName | null; minutesUntil: number | null; progress: number | null } {
  const now = getNowMinutes(timeZone)
  if (now === null) return { name: null, minutesUntil: null, progress: null }
  const fajr = parseMinutes(times.fajr)
  const isha = parseMinutes(times.isha)
  let next: PrayerName | null = null
  let minDiff = Infinity
  for (const name of PRAYER_ORDER) {
    if (name === 'sunrise') continue
    const t = parseMinutes(times[name])
    const diff = t - now
    if (diff >= 0 && diff < minDiff) {
      minDiff = diff
      next = name
    }
  }
  if (next === null) {
    // After Isha, next is Fajr tomorrow
    const untilFajr = 24 * 60 - now + fajr
    return { name: 'fajr', minutesUntil: untilFajr, progress: 1 }
  }
  const progress = isha > fajr ? Math.max(0, Math.min(1, (now - fajr) / (isha - fajr))) : null
  return { name: next, minutesUntil: minDiff, progress }
}

function formatCountdown(minutes: number, t: ReturnType<typeof useI18n>['t']): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}${t.prayerTimes.hoursShort} ${m}${t.prayerTimes.minutesShort}`
  return `${m}${t.prayerTimes.minutesShort}`
}

function formatPrayerTime(hhmm: string, format: '24h' | '12h', ampmStyle: 'en' | 'ar'): string {
  if (format === '24h') return hhmm
  const [hStr, m] = hhmm.split(':')
  let h = Number(hStr)
  const ampm = h < 12 ? (ampmStyle === 'ar' ? 'ص' : 'AM') : (ampmStyle === 'ar' ? 'م' : 'PM')
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

const FEATURED_CITY_IDS = ['riyadh', 'makkah', 'madinah', 'jeddah', 'dubai', 'cairo', 'istanbul', 'karachi', 'jakarta', 'london']
const RECENT_KEY = 'waqf-prayer-recent'
const TIME_FORMAT_KEY = 'waqf-prayer-time-format'
const SHOW_HIJRI_KEY = 'waqf-prayer-show-hijri'
const AMPM_STYLE_KEY = 'waqf-prayer-ampm-style'

function methodForTimezone(tz: string): string | null {
  if (tz === 'Asia/Riyadh' || tz === 'Asia/Qatar' || tz === 'Asia/Kuwait' || tz.startsWith('Asia/Riyadh')) return 'umm-al-qura'
  if (tz === 'Asia/Dubai' || tz === 'Asia/Muscat') return 'umm-al-qura'
  if (tz === 'Africa/Cairo') return 'egyptian'
  if (tz === 'Asia/Karachi') return 'kuwait'
  return null
}

export default function PrayerTimesTry() {
  const { t, locale } = useI18n()
  const datalistId = useId()
  const latId = useId()
  const lonId = useId()
  const dateId = useId()
  const tzId = useId()
  const citySearchId = useId()

  const [cityId, setCityId] = useState<string>('riyadh')
  const [citySearch, setCitySearch] = useState('')
  const [recentCities, setRecentCities] = useState<string[]>([])
  const [showAllCities, setShowAllCities] = useState(false)
  const [lat, setLat] = useState('24.7136')
  const [lon, setLon] = useState('46.6753')
  const [dateStr, setDateStr] = useState(todayISO())
  const [timeZone, setTimeZone] = useState('Asia/Riyadh')
  const [methodId, setMethodId] = useState(() => methodForTimezone('Asia/Riyadh') ?? DEFAULT_METHOD_ID)
  const [customFajr, setCustomFajr] = useState('18')
  const [customIsha, setCustomIsha] = useState('17')
  const [asr, setAsr] = useState<'standard' | 'hanafi'>(DEFAULT_ASR)
  const [highLat, setHighLat] = useState(DEFAULT_HIGH_LAT)
  const [fajrAdj, setFajrAdj] = useState('0')
  const [dhuhrAdj, setDhuhrAdj] = useState('0')
  const [asrAdj, setAsrAdj] = useState('0')
  const [maghribAdj, setMaghribAdj] = useState('0')
  const [ishaAdj, setIshaAdj] = useState('0')
  const [copied, setCopied] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [nowTick, setNowTick] = useState(0)
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount-time sync from external system (browser TZ)
        setTimeZone((prev) => (prev === tz ? prev : tz))
        const m = methodForTimezone(tz)
        if (m) setMethodId(m)
      }
    } catch {
      // keep default
    }
  }, [])
  const [copyFailed, setCopyFailed] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h')
  const [showHijri, setShowHijri] = useState(false)
  const [ampmStyle, setAmpmStyle] = useState<'en' | 'ar'>('en')
  const [showMoreToggles, setShowMoreToggles] = useState(false)

  // Recent cities from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) {
        const arr = JSON.parse(raw) as string[]
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from storage
        if (Array.isArray(arr)) setRecentCities(arr.slice(0, 3))
      }
    } catch {
      // ignore
    }
  }, [])

  // Load time format preference
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIME_FORMAT_KEY)
      if (raw === '12h' || raw === '24h') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from storage
        setTimeFormat(raw)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(TIME_FORMAT_KEY, timeFormat)
    } catch {
      // ignore
    }
  }, [timeFormat])

  // Load Hijri / AMPM preferences
  useEffect(() => {
    try {
      const h = localStorage.getItem(SHOW_HIJRI_KEY)
      if (h === '1') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from storage
        setShowHijri(true)
      }
      if (h === '0') setShowHijri(false)
      const a = localStorage.getItem(AMPM_STYLE_KEY)
      if (a === 'ar' || a === 'en') setAmpmStyle(a)
      else if (locale === 'ar') setAmpmStyle('ar')
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount, locale captured
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SHOW_HIJRI_KEY, showHijri ? '1' : '0')
    } catch {
      // ignore
    }
  }, [showHijri])

  useEffect(() => {
    try {
      localStorage.setItem(AMPM_STYLE_KEY, ampmStyle)
    } catch {
      // ignore
    }
  }, [ampmStyle])

  function pushRecent(id: string) {
    if (id === 'custom') return
    setRecentCities((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 3)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  // Shareable URL — read on mount
  /* eslint-disable react-hooks/set-state-in-effect -- URL → state sync on mount */
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const city = sp.get('city')
      const date = sp.get('date')
      const method = sp.get('method')
      const asrQ = sp.get('asr')
      const high = sp.get('highLat')
      if (city && getCity(city)) {
        handleCitySelect(city)
        if (date) setDateStr(date)
        if (method) setMethodId(method)
        if (asrQ === 'hanafi' || asrQ === 'standard') setAsr(asrQ as 'hanafi' | 'standard')
        if (high) setHighLat(high as typeof highLat)
      } else if (date || method || asrQ || high) {
        if (date) setDateStr(date)
        if (method && (getMethod(method) || method === 'custom')) setMethodId(method)
        if (asrQ === 'hanafi' || asrQ === 'standard') setAsr(asrQ as 'hanafi' | 'standard')
        if (high) setHighLat(high as typeof highLat)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Shareable URL — write on change
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      sp.set('city', cityId)
      sp.set('date', dateStr)
      sp.set('method', methodId)
      sp.set('asr', asr)
      sp.set('highLat', highLat)
      if (cityId === 'custom') {
        sp.set('lat', lat)
        sp.set('lon', lon)
        sp.set('tz', timeZone)
      } else {
        sp.delete('lat')
        sp.delete('lon')
        sp.delete('tz')
      }
      const url = `${window.location.pathname}?${sp.toString()}`
      window.history.replaceState(null, '', url)
    } catch {
      // ignore
    }
  }, [cityId, dateStr, methodId, asr, highLat, lat, lon, timeZone])

  // Tick for countdown (update every minute)
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((x) => x + 1), 60000)
    return () => window.clearInterval(id)
  }, [])

  const parsedDate = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  }, [dateStr])

  const hijriStr = useMemo(() => {
    if (!parsedDate) return null
    try {
      const fmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone,
        calendar: 'islamic-umalqura',
      } as Intl.DateTimeFormatOptions)
      return fmt.format(parsedDate)
    } catch {
      return null
    }
  }, [parsedDate, timeZone, locale])

  const customFajrNum = parseFloat(customFajr)
  const customIshaNum = parseFloat(customIsha)
  const customValid =
    methodId !== 'custom' ||
    (Number.isFinite(customFajrNum) && customFajrNum > 0 && customFajrNum <= 30 && Number.isFinite(customIshaNum) && customIshaNum > 0 && customIshaNum <= 30)

  const result = useMemo(() => {
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum) || !parsedDate) return null
    if (!customValid) return { ok: false as const, reason: 'invalid-input' as const, details: 'custom angles' }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format(parsedDate)
    } catch {
      return { ok: false as const, reason: 'invalid-timezone' as const }
    }
    const r = calculatePrayerTimes({
      latitude: latNum,
      longitude: lonNum,
      date: parsedDate,
      timeZone,
      methodId,
      customFajrAngle: methodId === 'custom' ? customFajrNum : undefined,
      customIshaAngle: methodId === 'custom' ? customIshaNum : undefined,
      asrJuristic: asr,
      highLatRule: highLat,
      adjustments: {
        fajr: parseInt(fajrAdj, 10) || 0,
        dhuhr: parseInt(dhuhrAdj, 10) || 0,
        asr: parseInt(asrAdj, 10) || 0,
        maghrib: parseInt(maghribAdj, 10) || 0,
        isha: parseInt(ishaAdj, 10) || 0,
      },
    })
    return r
  }, [lat, lon, parsedDate, timeZone, methodId, customFajrNum, customIshaNum, customValid, asr, highLat, fajrAdj, dhuhrAdj, asrAdj, maghribAdj, ishaAdj])

  const methodMeta = useMemo(() => {
    if (methodId === 'custom') {
      return {
        id: 'custom',
        name: 'Custom',
        nameAr: 'مخصص',
        source: 'User custom',
        fajrAngle: customFajrNum,
        ishaAngle: customIshaNum,
      }
    }
    return getMethod(methodId)
  }, [methodId, customFajrNum, customIshaNum])

  const methodDisplayName = methodMeta ? (locale === 'ar' ? (methodMeta as { nameAr: string }).nameAr : (methodMeta as { name: string }).name) : ''

  const suggestedMethod = useMemo(() => methodForTimezone(timeZone), [timeZone])
  const showMethodSuggestion = suggestedMethod !== null && suggestedMethod !== methodId && methodId !== 'custom'

  // Next prayer + progress (uses nowTick to refresh)
  const nextPrayer = useMemo(() => {
    void nowTick
    if (!result || !result.ok) return null
    return getNextPrayer(result.times, result.meta.timeZone)
  }, [result, nowTick])

  function handleCitySelect(id: string) {
    if (id === 'custom') {
      setCityId('custom')
      return
    }
    const city = getCity(id)
    if (!city) return
    setCityId(id)
    setLat(String(city.lat))
    setLon(String(city.lon))
    setTimeZone(city.timeZone)
    if (city.country === 'SA') setMethodId('umm-al-qura')
    else if (city.country === 'EG') setMethodId('egyptian')
    else if (city.country === 'AE' || city.country === 'QA') setMethodId('umm-al-qura')
    else setMethodId(DEFAULT_METHOD_ID)
    setAsr(DEFAULT_ASR)
    pushRecent(id)
  }

  async function handleUseLocation() {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError(t.prayerTimes.permissionDenied)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5))
        setLon(pos.coords.longitude.toFixed(5))
        setCityId('custom')
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
          if (tz) {
            setTimeZone(tz)
            const m = methodForTimezone(tz)
            if (m) setMethodId(m)
          }
        } catch {
          // keep
        }
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) setGeoError(t.prayerTimes.permissionDenied)
        else setGeoError(t.prayerTimes.permissionDenied)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function copyText(text: string, key: string) {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
      setCopyFailed(false)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
      setCopyFailed(true)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 1500)
    } catch {
      setCopyFailed(true)
    }
  }

  function handleCopyJson() {
    if (!result || !result.ok) return
    const note =
      locale === 'ar'
        ? 'تقدير — تحقق مع الجهات المحلية. تتضمن طريقة الحساب والتعديلات؛ هذا الناتج ليس فتوى.'
        : 'Estimate — verify with local authorities. Calculation method and adjustments are included; this output is not a fatwa.'
    const payload = {
      date: result.meta.dateISO,
      timeZone: result.meta.timeZone,
      latitude: result.meta.latitude,
      longitude: result.meta.longitude,
      method: { id: result.meta.method.id, source: result.meta.method.source, fajrAngle: result.meta.method.fajrAngle, ishaAngle: result.meta.method.ishaAngle },
      asrJuristic: result.meta.asrJuristic,
      highLatRule: result.meta.highLatRule,
      adjustments: result.meta.adjustments,
      times: result.times,
      note,
      generatedAt: new Date().toISOString(),
    }
    copyText(JSON.stringify(payload, null, 2), 'json')
  }

  function handleCopyCsv() {
    if (!result || !result.ok) return
    const header = 'date,timeZone,latitude,longitude,methodId,asrJuristic,highLatRule,fajr,sunrise,dhuhr,asr,maghrib,isha'
    const row = [
      result.meta.dateISO,
      result.meta.timeZone,
      result.meta.latitude,
      result.meta.longitude,
      result.meta.method.id,
      result.meta.asrJuristic,
      result.meta.highLatRule,
      ...PRAYER_ORDER.map((k) => result.times[k]),
    ].join(',')
    copyText(`${header}\n${row}`, 'csv')
  }

  const latError = lat.trim() !== '' && !Number.isFinite(parseFloat(lat))
  const lonError = lon.trim() !== '' && !Number.isFinite(parseFloat(lon))
  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase()
    if (!q) return showAllCities ? CITIES : CITIES.filter((c) => FEATURED_CITY_IDS.includes(c.id))
    return CITIES.filter((c) => {
      const hay = `${c.name} ${c.nameAr} ${c.country} ${c.timeZone}`.toLowerCase()
      return hay.includes(q)
    }).slice(0, 12)
  }, [citySearch, showAllCities])

  const recentVisible = recentCities.map((id) => getCity(id)).filter(Boolean) as typeof CITIES

  return (
    <div className="space-y-4">
      {/* Result on top — instant, no scroll */}
      {result && result.ok ? (
        <div className="space-y-3" data-testid="result-pt">
          <div className="glass-panel overflow-hidden rounded-[20px] border border-line/70 p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-accent-soft/40 px-4 py-3">
              <span className="text-sm font-semibold">{t.prayerTimes.resultTitle}</span>
              <span className="font-mono-ui text-xs text-muted" dir="ltr">
                {result.meta.dateISO}
                {showHijri && hijriStr ? ` • ${hijriStr}` : ''} • {result.meta.timeZone}
              </span>
            </div>
            {nextPrayer && nextPrayer.name && nextPrayer.minutesUntil !== null && (
              <div className="relative flex items-center justify-between overflow-hidden border-y border-accent/20 bg-accent/10 px-4 py-2.5 text-xs font-semibold text-accent-strong backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent/10 via-white/20 to-accent/5" />
                <span className="relative flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  {t.prayerTimes.nextPrayer}: {t.prayerTimes[nextPrayer.name]} • {t.prayerTimes.nextIn.replace('{time}', formatCountdown(nextPrayer.minutesUntil!, t))}
                </span>
                <span className="relative font-mono-ui text-[11px] text-accent/70">{t.prayerTimes[nextPrayer.name]}</span>
              </div>
            )}
            {nextPrayer && nextPrayer.progress != null && (
              <div className="h-1.5 overflow-hidden bg-line/30 backdrop-blur-sm">
                <div className="h-full bg-accent/80 backdrop-blur-md transition-all duration-700" style={{ width: `${(nextPrayer.progress! * 100).toFixed(1)}%` }} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-y border-line/40 bg-surface/50 px-3 py-2">
              <div className="flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Time format">
                <button
                  type="button"
                  onClick={() => setTimeFormat('24h')}
                  aria-pressed={timeFormat === '24h'}
                  data-testid="button-time-24h"
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${timeFormat === '24h' ? 'bg-accent text-paper' : 'text-muted hover:text-ink'}`}
                >
                  {t.prayerTimes.timeFormat24}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat('12h')}
                  aria-pressed={timeFormat === '12h'}
                  data-testid="button-time-12h"
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${timeFormat === '12h' ? 'bg-accent text-paper' : 'text-muted hover:text-ink'}`}
                >
                  {t.prayerTimes.timeFormat12}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreToggles(!showMoreToggles)}
                aria-expanded={showMoreToggles}
                aria-label={showMoreToggles ? 'Hide options' : 'Show more options'}
                data-testid="button-toggle-more"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-accent/30 hover:text-accent"
              >
                <ArrowRightIcon className={`h-3.5 w-3.5 transition-transform ${showMoreToggles ? 'rotate-90' : ''}`} />
              </button>
              {showMoreToggles && (
                <>
                  <div className="flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Hijri">
                    <button
                      type="button"
                      onClick={() => setShowHijri(false)}
                      aria-pressed={!showHijri}
                      data-testid="button-hijri-off"
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${!showHijri ? 'bg-accent text-paper' : 'text-muted hover:text-ink'}`}
                    >
                      {t.prayerTimes.hideHijri}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHijri(true)}
                      aria-pressed={showHijri}
                      data-testid="button-hijri-on"
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${showHijri ? 'bg-accent text-paper' : 'text-muted hover:text-ink'}`}
                    >
                      {t.prayerTimes.showHijri}
                    </button>
                  </div>
                  {timeFormat === '12h' && (
                    <div className="flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label="AM/PM style">
                      <button
                        type="button"
                        onClick={() => setAmpmStyle('en')}
                        aria-pressed={ampmStyle === 'en'}
                        data-testid="button-ampm-en"
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${ampmStyle === 'en' ? 'bg-accent text-paper' : 'text-muted hover:text-ink'}`}
                      >
                        {t.prayerTimes.ampmEn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmpmStyle('ar')}
                        aria-pressed={ampmStyle === 'ar'}
                        data-testid="button-ampm-ar"
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${ampmStyle === 'ar' ? 'bg-accent text-paper' : 'text-muted hover:text-ink'}`}
                      >
                        {t.prayerTimes.ampmAr}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-3 gap-px bg-line/60 sm:grid-cols-6">
              {PRAYER_ORDER.map((name) => {
                const isNext = nextPrayer?.name === name
                return (
                  <div
                    key={name}
                    className={`relative overflow-hidden px-3 py-4 text-center transition-all ${isNext ? 'bg-accent/10 backdrop-blur-xl' : 'bg-surface'}`}
                  >
                    {isNext && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/10 to-accent/5" />}
                    <p className={`eyebrow relative ${isNext ? 'text-accent' : 'text-muted'}`}>{t.prayerTimes[name]}</p>
                    <p className={`relative mt-1 font-display text-lg font-semibold ${isNext ? 'text-accent-strong' : ''}`} dir="ltr" data-testid={`value-pt-${name}`}>{formatPrayerTime(result.times[name], timeFormat, ampmStyle)}</p>
                    {isNext && <p className="relative mt-1 text-[10px] font-bold uppercase tracking-wide text-accent">{t.prayerTimes.nextPrayer}</p>}
                  </div>
                )
              })}
            </div>
            <div className="border-t border-line/60 bg-accent-soft/20 px-4 py-3">
              <p className="text-xs leading-5 text-muted">
                <span className="font-semibold text-ink">{t.prayerTimes.methodLabel}:</span> {methodDisplayName}
                {' • '}{t.prayerTimes.methodSource}: {methodMeta?.source ?? result.meta.method.source}
                {' • '}{t.prayerTimes.asrLabel}: {result.meta.asrJuristic === 'hanafi' ? t.prayerTimes.asrHanafi : t.prayerTimes.asrStandard}
                {' • '}{t.prayerTimes.highLatLabel}: {t.prayerTimes.highLatOptions[result.meta.highLatRule === 'middle-of-night' ? 'middleOfNight' : result.meta.highLatRule === 'one-seventh' ? 'oneSeventh' : result.meta.highLatRule === 'angle-based' ? 'angleBased' : 'none']}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted" dir="ltr">
                {result.meta.latitude.toFixed(4)}, {result.meta.longitude.toFixed(4)} • {result.meta.timeZone} • {Object.entries(result.meta.adjustments).filter(([,v])=>v!==0).map(([k,v])=>`${k} ${v>0?'+':''}${v}`).join(', ') || t.prayerTimes.noAdjustments}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopyLink} className="px-4! py-2! text-xs" data-testid="button-copy-link">
              {copiedLink ? `✓ ${t.prayerTimes.copiedLink}` : t.prayerTimes.copyLink}
            </Button>
            <Button variant="outline" onClick={handleCopyJson} className="px-4! py-2! text-xs" data-testid="button-copy-json">
              {copied === 'json' ? `✓ ${t.prayerTimes.copied}` : t.prayerTimes.copyJson}
            </Button>
            <Button variant="outline" onClick={handleCopyCsv} className="px-4! py-2! text-xs" data-testid="button-copy-csv">
              {copied === 'csv' ? `✓ ${t.prayerTimes.copied}` : t.prayerTimes.copyCsv}
            </Button>
          </div>
          {copyFailed && <p className="text-xs font-medium text-danger" role="alert">{t.prayerTimes.copyFailed}</p>}
        </div>
      ) : (
        <div aria-live="polite" className="space-y-3">
          {result === null && (
            <div className="flex gap-3 rounded-2xl border border-danger/40 bg-clay-soft/80 p-4 backdrop-blur-xl" role="alert">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger" />
              <p className="text-xs font-bold leading-5 text-danger">{t.prayerTimes.invalidInput}</p>
            </div>
          )}
          {result && !result.ok && result.reason === 'invalid-timezone' && (
            <div className="flex gap-3 rounded-2xl border border-danger/40 bg-clay-soft/80 p-4 backdrop-blur-xl" data-testid="status-pt-tz" role="alert">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger" />
              <p className="text-sm font-bold leading-6 text-danger">{t.prayerTimes.invalidTimezone}</p>
            </div>
          )}
          {result && !result.ok && result.reason === 'polar-unresolved' && (
            <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 backdrop-blur-xl" data-testid="status-pt-polar" role="alert">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm font-medium leading-6 text-amber-900">{t.prayerTimes.polarUnresolved}</p>
            </div>
          )}
          {result && !result.ok && result.reason === 'invalid-input' && (
            <div className="flex gap-3 rounded-2xl border border-danger/40 bg-clay-soft/80 p-4 backdrop-blur-xl" data-testid="status-pt-invalid" role="alert">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger" />
              <p className="text-sm font-bold leading-6 text-danger">{t.prayerTimes.invalidInput}</p>
            </div>
          )}
        </div>
      )}

      {/* City presets — 1 tap = location + timezone + method */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{t.prayerTimes.cityLabel}</span>
          <span className="text-[11px] text-muted">{t.prayerTimes.hanbaliNote}</span>
        </div>
        <div className="mt-2">
          <label htmlFor={citySearchId} className="sr-only">{t.prayerTimes.citySearchPlaceholder}</label>
          <input
            id={citySearchId}
            type="search"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder={t.prayerTimes.citySearchPlaceholder}
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10"
            data-testid="input-city-search"
          />
        </div>
        {recentVisible.length > 0 && !citySearch && (
          <div className="mt-2">
            <span className="text-[11px] font-semibold text-muted">{t.prayerTimes.recentCities}</span>
            <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
              {recentVisible.map((city) => {
                const label = locale === 'ar' ? city.nameAr : city.name
                return (
                  <button
                    key={`recent-${city.id}`}
                    type="button"
                    onClick={() => handleCitySelect(city.id)}
                    data-testid={`button-recent-${city.id}`}
                    className="shrink-0 cursor-pointer rounded-full border border-accent/20 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent hover:text-paper"
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locating}
            aria-pressed={cityId === 'custom' && locating}
            className={`shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${cityId === 'custom' && lat === '' ? 'bg-accent text-paper border-accent' : 'border-line bg-surface hover:border-accent/40 hover:text-accent'}`}
            data-testid="button-city-my-location"
          >
            {locating ? t.prayerTimes.locating : `📍 ${t.prayerTimes.useMyLocationShort}`}
          </button>
          {filteredCities.map((city) => {
            const label = locale === 'ar' ? city.nameAr : city.name
            const active = cityId === city.id
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleCitySelect(city.id)}
                aria-pressed={active}
                data-testid={`button-city-${city.id}`}
                className={`shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${active ? 'bg-accent text-paper border-accent' : 'border-line bg-surface text-muted hover:border-accent/30 hover:text-ink'}`}
              >
                {label}
              </button>
            )
          })}
          {!citySearch && (
            <button
              type="button"
              onClick={() => setShowAllCities((v) => !v)}
              className="shrink-0 cursor-pointer rounded-full border border-dashed border-line bg-surface px-3 py-2 text-xs font-medium text-muted hover:border-accent/30 hover:text-accent"
              data-testid="button-city-more"
            >
              {showAllCities ? '−' : `+ ${CITIES.length - filteredCities.length}`} {t.prayerTimes.moreMethods}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleCitySelect('custom')}
            aria-pressed={cityId === 'custom'}
            className={`shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-medium ${cityId === 'custom' ? 'bg-line/60 border-line text-ink' : 'border-line bg-surface text-muted hover:text-ink'}`}
            data-testid="button-city-custom"
          >
            {t.prayerTimes.customCoords}
          </button>
        </div>
      </div>

      {/* Date + Today/Tomorrow */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={dateId} className="block text-sm">
            <span className="mb-1.5 block font-medium">{t.prayerTimes.dateLabel}</span>
            <input
              id={dateId}
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className={inputClasses}
              dir="ltr"
              data-testid="input-pt-date"
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setDateStr(todayISO())}
              aria-pressed={dateStr === todayISO()}
              data-testid="button-pt-today"
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${dateStr === todayISO() ? 'bg-accent text-paper border-accent' : 'border-line bg-surface text-muted hover:border-accent/30'}`}
            >
              {t.prayerTimes.today}
            </button>
            <button
              type="button"
              onClick={() => setDateStr(tomorrowISO())}
              aria-pressed={dateStr === tomorrowISO()}
              data-testid="button-pt-tomorrow"
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${dateStr === tomorrowISO() ? 'bg-accent text-paper border-accent' : 'border-line bg-surface text-muted hover:border-accent/30'}`}
            >
              {t.prayerTimes.tomorrow}
            </button>
          </div>
        </div>
        <label htmlFor={tzId} className="block text-sm">
          <span className="mb-1.5 block font-medium">{t.prayerTimes.timezoneLabel}</span>
          <input
            id={tzId}
            type="text"
            value={timeZone}
            onChange={(e) => {
              const v = e.target.value
              setTimeZone(v)
              setCityId('custom')
              const m = methodForTimezone(v)
              if (m) setMethodId(m)
            }}
            placeholder={t.prayerTimes.timezonePlaceholder}
            className={inputClasses}
            dir="ltr"
            list={datalistId}
            autoComplete="off"
            spellCheck={false}
            data-testid="input-pt-tz"
          />
          <datalist id={datalistId}>
            <option value="Asia/Riyadh" />
            <option value="Asia/Dubai" />
            <option value="Asia/Karachi" />
            <option value="Africa/Cairo" />
            <option value="Europe/London" />
            <option value="Europe/Istanbul" />
            <option value="America/New_York" />
            <option value="Asia/Jakarta" />
            <option value="Asia/Kuala_Lumpur" />
            <option value="Asia/Baghdad" />
            <option value="Africa/Casablanca" />
          </datalist>
        </label>
      </div>

      {/* Conventions — compact, one row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">{t.prayerTimes.methodLabel}</span>
          <select
            value={methodId}
            onChange={(e) => setMethodId(e.target.value)}
            className={selectClasses}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            data-testid="select-pt-method"
          >
            {PRAYER_METHODS.map((m) => (
              <option key={m.id} value={m.id}>{locale === 'ar' ? m.nameAr : m.name}</option>
            ))}
            <option value="custom">{t.prayerTimes.custom}</option>
          </select>
          {methodMeta && (
            <span className="mt-1 block text-[11px] leading-4 text-muted">
              {methodMeta.source} • {(methodMeta as { fajrAngle: number }).fajrAngle}° / {(methodMeta as { ishaAngle: number | null }).ishaAngle !== null ? `${(methodMeta as { ishaAngle: number | null }).ishaAngle}°` : `${(methodMeta as unknown as { ishaIntervalMinutes?: number }).ishaIntervalMinutes ?? 90}′`}
            </span>
          )}
          {showMethodSuggestion && suggestedMethod && (
            <button
              type="button"
              onClick={() => setMethodId(suggestedMethod)}
              className="mt-1 text-left text-[11px] font-medium text-amber-700 hover:text-amber-800"
              data-testid="button-suggest-method"
            >
              {locale === 'ar' ? `لـ ${timeZone} يُنصح بـ ${getMethod(suggestedMethod)?.nameAr ?? suggestedMethod} — تبديل؟` : `For ${timeZone} we usually use ${getMethod(suggestedMethod)?.name ?? suggestedMethod} — switch?`}
            </button>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">{t.prayerTimes.asrLabel}</span>
          <select value={asr} onChange={(e) => setAsr(e.target.value as 'standard' | 'hanafi')} className={selectClasses} data-testid="select-pt-asr">
            <option value="standard">{t.prayerTimes.asrStandard}</option>
            <option value="hanafi">{t.prayerTimes.asrHanafi}</option>
          </select>
          {asr === 'standard' && <span className="mt-1 block text-[11px] text-muted">{t.prayerTimes.hanbaliNote}</span>}
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">{t.prayerTimes.highLatLabel}</span>
          <select value={highLat} onChange={(e) => setHighLat(e.target.value as typeof highLat)} className={selectClasses} data-testid="select-pt-highlat">
            <option value="middle-of-night">{t.prayerTimes.highLatOptions.middleOfNight}</option>
            <option value="one-seventh">{t.prayerTimes.highLatOptions.oneSeventh}</option>
            <option value="angle-based">{t.prayerTimes.highLatOptions.angleBased}</option>
            <option value="none">{t.prayerTimes.highLatOptions.none}</option>
          </select>
        </label>
      </div>

      {methodId === 'custom' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">{t.prayerTimes.customFajrLabel}</span>
            <input type="number" value={customFajr} onChange={(e) => setCustomFajr(e.target.value)} className={inputClasses} step="0.5" dir="ltr" min="1" max="30" data-testid="input-pt-fajr-angle" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">{t.prayerTimes.customIshaLabel}</span>
            <input type="number" value={customIsha} onChange={(e) => setCustomIsha(e.target.value)} className={inputClasses} step="0.5" dir="ltr" min="1" max="30" data-testid="input-pt-isha-angle" />
          </label>
        </div>
      )}
      {methodId === 'custom' && !customValid && (
        <div className="flex gap-3 rounded-2xl border border-danger/40 bg-clay-soft/80 p-4 backdrop-blur-xl" role="alert">
          <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger" />
          <p className="text-xs font-bold leading-5 text-danger">{t.prayerTimes.invalidInput}</p>
        </div>
      )}

      {/* Fine-tune — collapsed, not competing with result */}
      <details className="group rounded-xl border border-line/60 bg-surface/50">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold">
          {t.prayerTimes.adjustmentsLabel} <span className="font-normal text-muted">— {t.prayerTimes.adjustmentsHint}</span>
          <span className="ml-2 text-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-line/60 p-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {[
              { key: 'fajr', val: fajrAdj, set: setFajrAdj, label: t.prayerTimes.fajr },
              { key: 'dhuhr', val: dhuhrAdj, set: setDhuhrAdj, label: t.prayerTimes.dhuhr },
              { key: 'asr', val: asrAdj, set: setAsrAdj, label: t.prayerTimes.asr },
              { key: 'maghrib', val: maghribAdj, set: setMaghribAdj, label: t.prayerTimes.maghrib },
              { key: 'isha', val: ishaAdj, set: setIshaAdj, label: t.prayerTimes.isha },
            ].map((adj) => (
              <label key={adj.key} className="block text-xs">
                <span className="mb-1 block font-medium">{adj.label}</span>
                <input type="number" value={adj.val} onChange={(e) => adj.set(e.target.value)} className={`${inputClasses} py-2 text-xs`} dir="ltr" data-testid={`input-pt-adj-${adj.key}`} />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-muted">{t.prayerTimes.sunriseNote}</p>
        </div>
      </details>

      {/* Coordinates — at bottom */}
      <details className="group rounded-xl border border-line/60 bg-surface/50" open={cityId === 'custom'}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold">
          {t.prayerTimes.customCoords} <span className="font-normal text-muted">— {lat}, {lon}</span>
          <span className="ml-2 text-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-line/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor={latId} className="block text-sm">
              <span className="mb-1.5 block font-medium">{t.prayerTimes.latLabel}</span>
              <input
                id={latId}
                type="number"
                inputMode="decimal"
                value={lat}
                onChange={(e) => {
                  setLat(e.target.value)
                  setCityId('custom')
                }}
                placeholder="24.7136"
                className={inputClasses}
                dir="ltr"
                step="any"
                autoComplete="off"
                aria-invalid={latError}
                data-testid="input-pt-lat"
              />
            </label>
            <label htmlFor={lonId} className="block text-sm">
              <span className="mb-1.5 block font-medium">{t.prayerTimes.lonLabel}</span>
              <input
                id={lonId}
                type="number"
                inputMode="decimal"
                value={lon}
                onChange={(e) => {
                  setLon(e.target.value)
                  setCityId('custom')
                }}
                placeholder="46.6753"
                className={inputClasses}
                dir="ltr"
                step="any"
                autoComplete="off"
                aria-invalid={lonError}
                data-testid="input-pt-lon"
              />
            </label>
          </div>
          {geoError && <p className="mt-2 text-xs font-medium text-danger" role="alert">{geoError}</p>}
          {(latError || lonError) && <p className="mt-2 text-xs font-medium text-danger" role="alert">{t.qibla.invalidCoords}</p>}
        </div>
      </details>

      <div className="flex gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 backdrop-blur-sm">
        <InfoIcon className="h-5 w-5 shrink-0 text-amber-700" />
        <p className="text-xs font-medium leading-5 text-amber-900"></p>
      </div>
    </div>
  )
}
