import { useCallback, useEffect, useState } from 'react'
import type { Counts, CustomDhikr, DhikrFilter } from './types'
import { customIdFor, dayKeyFromMs, validateCustomDraft, type CustomDraft } from './engine'

export const AUTOSAVE_KEY = 'waqf-adhkar-autosave'
export const PROGRESS_KEY = 'waqf-adhkar-progress'
export const PREFS_KEY = 'waqf-adhkar-prefs'
export const CUSTOM_KEY = 'waqf-adhkar-custom'

export type AdhkarPrefs = {
  filter: DhikrFilter
  digits: 'latn' | 'arab'
  fontSize: 'md' | 'lg' | 'xl'
  printLayout: 'booklet' | 'checklist'
  printCover: 'band' | 'light'
  printMeanings: boolean
  printSources: boolean
  printPaper: 'a4' | 'a5'
}

const DEFAULT_PREFS: AdhkarPrefs = {
  filter: 'morning',
  digits: 'latn',
  fontSize: 'lg',
  printLayout: 'booklet',
  printCover: 'band',
  printMeanings: true,
  printSources: true,
  printPaper: 'a4',
}

type StoredProgress = { day: string; counts: Counts }

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable (private mode, quota). Saving is best-effort.
  }
}

function sanitizeCounts(raw: unknown): Counts {
  if (!raw || typeof raw !== 'object') return {}
  const out: Counts = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[k] = Math.min(1000, Math.floor(v))
    }
  }
  return out
}

function sanitizeCustom(raw: unknown): CustomDhikr[] {
  if (!Array.isArray(raw)) return []
  const out: CustomDhikr[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    if (
      typeof e.id !== 'string' ||
      typeof e.arabic !== 'string' ||
      e.arabic.trim() === '' ||
      typeof e.target !== 'number' ||
      !Number.isInteger(e.target) ||
      e.target < 1 ||
      e.target > 1000
    ) {
      continue
    }
    out.push({
      id: e.id,
      sets:
        Array.isArray(e.sets) && e.sets.includes('evening') && !e.sets.includes('morning')
          ? ['evening']
          : Array.isArray(e.sets) && e.sets.includes('morning') && !e.sets.includes('evening')
            ? ['morning']
            : ['morning', 'evening'],
      titleEn: typeof e.titleEn === 'string' ? e.titleEn : 'My dhikr',
      titleAr: typeof e.titleAr === 'string' ? e.titleAr : 'ذكر خاص',
      arabic: e.arabic,
      meaningEn: typeof e.meaningEn === 'string' ? e.meaningEn : '',
      meaningAr: typeof e.meaningAr === 'string' ? e.meaningAr : '',
      target: e.target,
      source: typeof e.source === 'string' ? e.source : 'Yours — kept on this device',
      hisnRef: 'Custom',
      custom: true,
    })
  }
  return out.slice(0, 50)
}

/**
 * Private vault: counts + custom items live in React state. They reach
 * localStorage only after an explicit opt-in ("Save on this device").
 * Preferences (set filter, digits, font size) persist like the Hijri prefs.
 */
export function useAdhkarVault() {
  const [autosave, setAutosave] = useState(false)
  const [counts, setCounts] = useState<Counts>({})
  const [custom, setCustom] = useState<CustomDhikr[]>([])
  const [prefs, setPrefs] = useState<AdhkarPrefs>(DEFAULT_PREFS)
  const [customError, setCustomError] = useState<string | null>(null)

  // Load once: prefs always, progress/custom only when opt-in was on.
  useEffect(() => {
    try {
      const p = readJSON<Partial<AdhkarPrefs>>(PREFS_KEY)
      if (p) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
        setPrefs({
          filter:
            p.filter === 'evening' || p.filter === 'all' || p.filter === 'custom'
              ? p.filter
              : 'morning',
          digits: p.digits === 'arab' ? 'arab' : 'latn',
          fontSize: p.fontSize === 'md' || p.fontSize === 'xl' ? p.fontSize : 'lg',
          printLayout: p.printLayout === 'checklist' ? 'checklist' : 'booklet',
          printCover: p.printCover === 'light' ? 'light' : 'band',
          printMeanings: p.printMeanings === false ? false : true,
          printSources: p.printSources === false ? false : true,
          printPaper: p.printPaper === 'a5' ? 'a5' : 'a4',
        })
      }
      if (localStorage.getItem(AUTOSAVE_KEY) === '1') {
        setAutosave(true)
        const stored = readJSON<StoredProgress>(PROGRESS_KEY)
        const today = dayKeyFromMs(Date.now())
        // Stale days reset gently — yesterday's marks never leak into today.
        if (stored && stored.day === today) setCounts(sanitizeCounts(stored.counts))
        setCustom(sanitizeCustom(readJSON(CUSTOM_KEY)))
      }
    } catch {
      // ignore — private mode stays in-memory
    }
  }, [])

  // Prefs persist (display only, like Hijri variant/numbering).
  useEffect(() => {
    writeJSON(PREFS_KEY, prefs)
  }, [prefs])

  // Progress + custom persist only behind the opt-in.
  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, autosave ? '1' : '0')
    } catch {
      // ignore
    }
    if (!autosave) return
    writeJSON(PROGRESS_KEY, { day: dayKeyFromMs(Date.now()), counts } satisfies StoredProgress)
    writeJSON(CUSTOM_KEY, custom)
  }, [autosave, counts, custom])

  const setCount = useCallback((id: string, next: number) => {
    setCounts((prev) => {
      if (next <= 0) {
        const rest = { ...prev }
        delete rest[id]
        return rest
      }
      return { ...prev, [id]: next }
    })
  }, [])

  const resetToday = useCallback(() => {
    setCounts({})
  }, [])

  const clearAll = useCallback(() => {
    setCounts({})
    setCustom([])
    setAutosave(false)
    try {
      localStorage.removeItem(PROGRESS_KEY)
      localStorage.removeItem(CUSTOM_KEY)
      localStorage.setItem(AUTOSAVE_KEY, '0')
    } catch {
      // ignore
    }
  }, [])

  const addCustom = useCallback(
    (draft: CustomDraft): boolean => {
      const error = validateCustomDraft(draft)
      if (error) {
        setCustomError(error)
        return false
      }
      setCustomError(null)
      const sets = draft.set === 'both' ? (['morning', 'evening'] as const) : ([draft.set] as const)
      const item: CustomDhikr = {
        id: customIdFor(Date.now()),
        sets: [...sets],
        titleEn: 'My dhikr',
        titleAr: 'ذكر خاص',
        arabic: draft.arabic.trim(),
        meaningEn: draft.meaningEn.trim(),
        meaningAr: draft.meaningAr.trim(),
        target: draft.target,
        source: 'Yours — kept on this device',
        hisnRef: 'Custom',
        custom: true,
      }
      setCustom((prev) => [...prev.slice(-49), item])
      return true
    },
    [],
  )

  const removeCustom = useCallback(
    (id: string) => {
      setCustom((prev) => prev.filter((i) => i.id !== id))
      setCounts((prev) => {
        if (!(id in prev)) return prev
        const rest = { ...prev }
        delete rest[id]
        return rest
      })
    },
    [],
  )

  return {
    autosave,
    setAutosave,
    counts,
    setCount,
    resetToday,
    clearAll,
    custom,
    addCustom,
    removeCustom,
    customError,
    prefs,
    setPrefs,
  }
}
