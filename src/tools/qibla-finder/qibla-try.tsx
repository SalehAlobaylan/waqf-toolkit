import { useEffect, useId, useMemo, useState, useRef } from 'react'
import { useI18n } from '@/i18n'
import { Card, Button } from '@/components/ui'
import { qiblaBearing } from './bearing'
import { KAABA } from './constants'
import { CITIES, getCity } from '@/lib/cities'
import { dialRotationForHeading, headingFromEvent, isCompassSupported, requestCompassPermission } from './compass'
import { AlertTriangleIcon, InfoIcon } from '@/components/icons'

const inputClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10'

function bearingToCardinal(b: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const idx = Math.round(b / 22.5) % 16
  return dirs[idx]
}

const FEATURED_CITY_IDS = ['riyadh', 'makkah', 'madinah', 'jeddah', 'dubai', 'cairo', 'istanbul', 'karachi', 'jakarta', 'london']
const RECENT_KEY = 'waqf-qibla-recent'

export default function QiblaTry() {
  const { t, locale } = useI18n()
  const latId = useId()
  const lonId = useId()
  const citySearchId = useId()
  const [cityId, setCityId] = useState('riyadh')
  const [citySearch, setCitySearch] = useState('')
  const [recentCities, setRecentCities] = useState<string[]>([])
  const [showAllCities, setShowAllCities] = useState(false)
  const [lat, setLat] = useState('24.7136')
  const [lon, setLon] = useState('46.6753')
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  // Compass (phone-only, experimental)
  const [hasCompass, setHasCompass] = useState(false)
  const [liveEnabled, setLiveEnabled] = useState(false)
  const [heading, setHeading] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [compassError, setCompassError] = useState<string | null>(null)
  const [permission, setPermission] = useState<string | null>(null)
  const liveRef = useRef(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount-time sync from external system (magnetometer detection)
    setHasCompass(isCompassSupported())
  }, [])

  // Recent from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) {
        const arr = JSON.parse(raw) as string[]
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
        if (Array.isArray(arr)) setRecentCities(arr.slice(0, 3))
      }
    } catch {
      // ignore
    }
  }, [])

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

  // Shareable URL — read
  /* eslint-disable react-hooks/set-state-in-effect -- URL → state sync on mount */
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const city = sp.get('city')
      const clat = sp.get('lat')
      const clon = sp.get('lon')
      if (city && getCity(city)) {
        handleCitySelect(city)
      } else if (clat && clon) {
        setLat(clat)
        setLon(clon)
        setCityId('custom')
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Shareable URL — write
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      if (cityId === 'custom') {
        sp.set('city', 'custom')
        sp.set('lat', lat)
        sp.set('lon', lon)
      } else {
        sp.set('city', cityId)
        sp.delete('lat')
        sp.delete('lon')
      }
      const url = `${window.location.pathname}?${sp.toString()}`
      window.history.replaceState(null, '', url)
    } catch {
      // ignore
    }
  }, [cityId, lat, lon])

  const result = useMemo(() => {
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    if (lat.trim() === '' || lon.trim() === '') return { status: 'empty' as const }
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return { status: 'invalid' as const }
    const r = qiblaBearing({ latitude: latNum, longitude: lonNum })
    if (!r.ok) return { status: r.reason as 'at-kaaba' | 'antipodal-ambiguous' | 'invalid-coordinates', reason: r.reason }
    return { status: 'ok' as const, bearing: r.bearing, distanceKm: r.distanceKm, method: r.method, lat: latNum, lon: lonNum }
  }, [lat, lon])

  const isInvalid = result.status === 'invalid' || result.status === 'invalid-coordinates'
  const bearingText = result.status === 'ok' ? `${result.bearing.toFixed(1)}°` : null
  const cardinal = result.status === 'ok' ? bearingToCardinal(result.bearing) : null
  const dialRotation = result.status === 'ok' ? dialRotationForHeading(result.bearing, liveEnabled ? heading : null) : 0
  const isLiveActive = liveEnabled && heading !== null

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
    pushRecent(id)
  }

  async function handleUseLocation() {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError(t.qibla.unavailable)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5))
        setLon(pos.coords.longitude.toFixed(5))
        setCityId('custom')
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) setGeoError(t.qibla.permissionDenied)
        else setGeoError(t.qibla.unavailable)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleEnableCompass() {
    setCompassError(null)
    const perm = await requestCompassPermission()
    setPermission(perm)
    if (perm === 'denied') {
      setCompassError(t.qibla.permissionDenied)
      return
    }
    const handler = (event: DeviceOrientationEvent) => {
      const state = headingFromEvent(event as unknown as { alpha: number | null; absolute?: boolean; webkitCompassHeading?: number; webkitCompassAccuracy?: number })
      if (state.heading !== null) {
        setHeading(state.heading)
        setAccuracy(state.accuracy)
      }
    }
    const handlerAbsolute = handler as unknown as EventListener
    window.addEventListener('deviceorientationabsolute', handlerAbsolute, true)
    window.addEventListener('deviceorientation', handlerAbsolute, true)
    liveRef.current = true
    setLiveEnabled(true)
    setHeading(null)
    setTimeout(() => {
      if (liveRef.current && heading === null) {
        // keep waiting
      }
    }, 5000)
    const cleanup = () => {
      window.removeEventListener('deviceorientationabsolute', handlerAbsolute, true)
      window.removeEventListener('deviceorientation', handlerAbsolute, true)
      liveRef.current = false
    }
    ;(handleEnableCompass as unknown as { cleanup?: () => void }).cleanup = cleanup
  }

  function handleDisableCompass() {
    const cleanup = (handleEnableCompass as unknown as { cleanup?: () => void }).cleanup
    if (cleanup) cleanup()
    setLiveEnabled(false)
    setHeading(null)
    setAccuracy(null)
  }

  async function copy() {
    if (result.status !== 'ok') return
    const lines = [
      `${t.qibla.bearingLabel}: ${bearingText} • ${cardinal} — ${t.qibla.trueNorthNote}`,
      `${t.qibla.distanceLabel}: ${result.distanceKm.toFixed(1)} ${t.qibla.distanceUnit}`,
      `${t.qibla.kaabaLabel}: ${KAABA.latitude}, ${KAABA.longitude} (${KAABA.datum} v${KAABA.version})`,
      `${t.qibla.methodLabel}: ${result.method}`,
      `${t.qibla.coordsLabel}: ${result.lat}, ${result.lon} • ${new Date().toISOString()}`,
      liveEnabled && heading !== null ? `${t.qibla.liveTitle} ${t.qibla.liveHeading.replace('{heading}', heading.toFixed(1))}${accuracy !== null ? ` ±${accuracy.toFixed(1)}°` : ''}` : null,
    ].filter(Boolean).join('\n')
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(lines)
      setCopyFailed(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
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
      {/* Laptop vs phone explanation — clear warning */}
      {!hasCompass && result.status === 'ok' && (
        <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 backdrop-blur-xl" data-testid="banner-no-compass" role="alert">
          <AlertTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-bold text-amber-900">{t.qibla.laptopTitle}</p>
            <p className="mt-1 text-xs leading-5 font-medium text-amber-800">{t.qibla.laptopBody}</p>
          </div>
        </div>
      )}

      {/* Result on top — liquid glass hero */}
      {result.status === 'ok' && (
        <div className="space-y-4" data-testid="result-qibla">
          <div className="glass-panel overflow-hidden rounded-[20px] border border-line/70">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-accent-soft/40 px-4 py-3">
              <span className="text-sm font-semibold">{t.qibla.bearingLabel}</span>
              <span className="font-mono-ui text-xs text-muted" dir="ltr">{bearingText} • {cardinal}</span>
            </div>
            <div className="grid gap-4 p-6 lg:grid-cols-[1fr_340px] lg:items-start">
              <div className="order-2 flex flex-col items-center gap-4 rounded-2xl border border-accent/15 bg-accent-soft/30 p-6 backdrop-blur-xl lg:order-1" dir="ltr">
                <div className="relative h-52 w-52 select-none sm:h-56 sm:w-56" dir="ltr">
                  <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true" role="img">
                    <title>Qibla dial — N at top, arrow to Kaaba</title>
                    <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" className="text-line" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="3" fill="currentColor" className="text-accent" />
                    <g className="text-muted" stroke="currentColor" strokeWidth="1.2">
                      <line x1="100" y1="8" x2="100" y2="18" />
                      <line x1="100" y1="182" x2="100" y2="192" />
                      <line x1="8" y1="100" x2="18" y2="100" />
                      <line x1="182" y1="100" x2="192" y2="100" />
                    </g>
                    <text x="100" y="14" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-accent font-mono-ui">N</text>
                    <text x="100" y="191" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-muted font-mono-ui">S</text>
                    <text x="188" y="103" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-muted font-mono-ui">E</text>
                    <text x="12" y="103" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-muted font-mono-ui">W</text>
                    <g transform={`rotate(${dialRotation} 100 100)`}>
                      <line x1="100" y1="100" x2="100" y2="28" stroke="currentColor" className="text-accent" strokeWidth="3" strokeLinecap="round" />
                      <g transform="translate(100 14)">
                        <circle r="10" fill="currentColor" className="text-accent" />
                        <text textAnchor="middle" dy="3.5" fontSize="8" fontWeight="700" className="fill-paper">🕋</text>
                      </g>
                    </g>
                    {isLiveActive && (
                      <g transform={`rotate(${-heading! % 360} 100 100)`} opacity="0.5">
                        <line x1="100" y1="100" x2="100" y2="18" stroke="currentColor" className="text-muted" strokeWidth="1.5" strokeDasharray="3 3" />
                      </g>
                    )}
                  </svg>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold shadow-card" dir="ltr">
                      {bearingText} • {cardinal}
                      {isLiveActive ? ` • live ${dialRotation.toFixed(1)}°` : ''}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="mt-1 font-display text-4xl font-semibold tracking-tight" dir="ltr" data-testid="value-bearing">
                    {bearingText} <span className="text-xl font-medium text-muted">{cardinal}</span>
                  </p>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-muted">{t.qibla.trueNorthNote}</p>
                  <p className="mt-2 max-w-sm text-[11px] leading-4 text-muted">{isLiveActive ? t.qibla.alignLive : t.qibla.alignStatic}</p>
                </div>
              </div>

              <div className="order-1 space-y-3 lg:order-2">
                <Card className="p-4">
                  <p className="eyebrow text-muted">{t.qibla.distanceLabel}</p>
                  <p className="mt-1 text-sm font-semibold" dir="ltr">{result.distanceKm.toFixed(1)} {t.qibla.distanceUnit}</p>
                  <p className="mt-2 text-xs leading-5 text-muted" dir="ltr">{t.qibla.kaabaLabel}: {KAABA.latitude}, {KAABA.longitude} ({KAABA.datum} v{KAABA.version})</p>
                  <a
                    href={`https://www.openstreetmap.org/directions?from=${result.lat},${result.lon}&to=${KAABA.latitude},${KAABA.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold text-paper hover:bg-accent-strong"
                  >
                    {t.qibla.viewOnMap}
                  </a>
                  <p className="mt-2 text-[11px] leading-4 text-muted">{t.qibla.bestForLaptops}</p>
                </Card>
                <Card className="p-4">
                  <p className="eyebrow text-muted">{t.qibla.methodLabel}</p>
                  <p className="mt-1 font-mono-ui text-xs leading-5 break-all">{result.method}</p>
                  <p className="mt-2 text-[11px] leading-4 text-muted">{t.qibla.checkedNote}</p>
                </Card>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button variant="outline" onClick={copy} className="px-4! py-2! text-xs" data-testid="button-copy-qibla">
                    {copied ? `✓ ${t.qibla.copied}` : t.qibla.copy}
                  </Button>
                  <Button variant="outline" onClick={handleCopyLink} className="px-4! py-2! text-xs" data-testid="button-copy-qibla-link">
                    {copiedLink ? `✓ ${t.qibla.copiedLink}` : t.qibla.copyLink}
                  </Button>
                  {copyFailed && <span className="text-xs font-medium text-danger" role="alert">{t.qibla.copyFailed}</span>}
                  {copied && <span className="text-xs font-medium text-accent" role="status">{t.qibla.bearingCopied}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-amber-200/60 bg-amber-50/60 px-4 py-3 backdrop-blur-sm">
              <InfoIcon className="h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-xs font-medium leading-5 text-amber-900"></p>
            </div>
          </div>
        </div>
      )}

      {result.status !== 'ok' && (
        <div aria-live="polite" className="space-y-3">
          {result.status === 'empty' && (
            <div className="flex gap-3 rounded-2xl border border-line/60 bg-surface/70 p-4 backdrop-blur-md">
              <InfoIcon className="h-5 w-5 shrink-0 text-muted" />
              <p className="text-xs leading-5 text-muted"></p>
            </div>
          )}
          {isInvalid && (
            <div className="flex gap-3 rounded-2xl border border-danger/40 bg-clay-soft/80 p-4 backdrop-blur-xl" role="alert">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger" />
              <p className="text-xs font-bold leading-5 text-danger">{t.qibla.invalidCoords}</p>
            </div>
          )}
          {geoError && (
            <div className="flex gap-3 rounded-2xl border border-danger/40 bg-clay-soft/80 p-4 backdrop-blur-xl" role="alert">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger" />
              <p className="text-xs font-bold leading-5 text-danger">{geoError}</p>
            </div>
          )}
          {result.status === 'at-kaaba' && (
            <div className="flex gap-3 rounded-2xl border border-accent/30 bg-accent-soft/70 p-4 backdrop-blur-xl" data-testid="status-at-kaaba" role="alert">
              <InfoIcon className="h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm font-medium leading-6">{t.qibla.atKaaba}</p>
            </div>
          )}
          {result.status === 'antipodal-ambiguous' && (
            <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 backdrop-blur-xl" data-testid="status-antipodal" role="alert">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm font-medium leading-6 text-amber-900">{t.qibla.antipodal}</p>
            </div>
          )}
        </div>
      )}

      {/* City presets — same 1-tap as Prayer */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{t.qibla.cityLabel}</span>
          <span className="text-[11px] text-muted">{t.qibla.checkedNote}</span>
        </div>
        <div className="mt-2">
          <label htmlFor={citySearchId} className="sr-only">{t.qibla.citySearchPlaceholder}</label>
          <input
            id={citySearchId}
            type="search"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder={t.qibla.citySearchPlaceholder}
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10"
            data-testid="input-qibla-city-search"
          />
        </div>
        {recentVisible.length > 0 && !citySearch && (
          <div className="mt-2">
            <span className="text-[11px] font-semibold text-muted">{t.qibla.recentCities}</span>
            <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
              {recentVisible.map((city) => {
                const label = locale === 'ar' ? city.nameAr : city.name
                return (
                  <button
                    key={`recent-${city.id}`}
                    type="button"
                    onClick={() => handleCitySelect(city.id)}
                    data-testid={`button-qibla-recent-${city.id}`}
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
            className="shrink-0 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold hover:border-accent/40 hover:text-accent disabled:opacity-50"
            data-testid="button-qibla-locate"
          >
            {locating ? t.qibla.locating : `📍 ${t.prayerTimes.useMyLocationShort}`}
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
              data-testid="button-qibla-more"
            >
              {showAllCities ? '−' : `+ ${CITIES.length - filteredCities.length}`} {t.qibla.moreCities}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleCitySelect('custom')}
            aria-pressed={cityId === 'custom'}
            className={`shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-medium ${cityId === 'custom' ? 'bg-line/60 border-line text-ink' : 'border-line bg-surface text-muted hover:text-ink'}`}
            data-testid="button-qibla-custom"
          >
            {t.qibla.customCoords}
          </button>
        </div>
      </div>

      {hasCompass && compassError && <p className="text-xs font-medium text-danger" role="alert">{compassError}</p>}

      {hasCompass && liveEnabled && (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft/40 p-3 backdrop-blur-xl" data-testid="banner-live" role="status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-bold text-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              {t.qibla.liveTitle} {heading !== null ? t.qibla.liveHeading.replace('{heading}', heading.toFixed(1)) : t.qibla.liveWaiting}
              {accuracy !== null ? ` (±${accuracy.toFixed(0)}°)` : ''}
              {permission ? ` • ${permission}` : ''}
            </p>
            <button type="button" onClick={handleDisableCompass} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted hover:border-accent/40 hover:text-accent">
              {t.qibla.disable}
            </button>
          </div>
          {accuracy !== null && accuracy > 20 && (
            <div className="mt-2 flex gap-2 rounded-xl border border-clay/30 bg-clay-soft/50 p-3 backdrop-blur-sm">
              <AlertTriangleIcon className="h-4 w-4 shrink-0 text-clay" />
              <p className="text-[11px] font-medium leading-4 text-clay-deep">{t.qibla.lowAccuracy}</p>
            </div>
          )}
          {heading === null && <p className="mt-2 flex gap-2 text-[11px] font-medium leading-4 text-muted"><InfoIcon className="h-4 w-4 shrink-0" />{t.qibla.noSensor}</p>}
        </div>
      )}

      {/* Coordinates at bottom */}
      <details className="group rounded-xl border border-line/60 bg-surface/50" open={cityId === 'custom'}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold">
          {t.qibla.customCoords} <span className="font-normal text-muted">— {lat}, {lon}</span>
          <span className="ml-2 text-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-line/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor={latId} className="block text-sm">
              <span className="mb-1.5 block font-medium">{t.qibla.latLabel}</span>
              <input
                id={latId}
                type="number"
                inputMode="decimal"
                value={lat}
                onChange={(e) => {
                  setLat(e.target.value)
                  setCityId('custom')
                }}
                placeholder={t.qibla.latPlaceholder}
                className={inputClasses}
                dir="ltr"
                step="any"
                autoComplete="off"
                aria-invalid={isInvalid}
                data-testid="input-qibla-lat"
              />
            </label>
            <label htmlFor={lonId} className="block text-sm">
              <span className="mb-1.5 block font-medium">{t.qibla.lonLabel}</span>
              <input
                id={lonId}
                type="number"
                inputMode="decimal"
                value={lon}
                onChange={(e) => {
                  setLon(e.target.value)
                  setCityId('custom')
                }}
                placeholder={t.qibla.lonPlaceholder}
                className={inputClasses}
                dir="ltr"
                step="any"
                autoComplete="off"
                aria-invalid={isInvalid}
                data-testid="input-qibla-lon"
              />
            </label>
          </div>
          {isInvalid && <p className="mt-2 text-xs font-medium text-danger" role="alert">{t.qibla.invalidCoords}</p>}
          {geoError && <p className="mt-2 text-xs font-medium text-danger" role="alert">{geoError}</p>}
        </div>
      </details>
    </div>
  )
}
