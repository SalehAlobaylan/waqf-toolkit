import { useCallback, useEffect, useReducer, useState } from 'react'
import { DEFAULT_STYLE, MAX_BLOCKS, type CardBlock, type CardStyle } from './types'
import { historyFrom, reducer, type HistoryState } from './engine/blocks'
import { isValidTemplateId, DEFAULT_TEMPLATE_ID } from './engine/templates'

export const PREFS_KEY = 'waqf-card-studio-prefs'
export const PROJECT_KEY = 'waqf-card-studio-project'
export const AUTOSAVE_KEY = 'waqf-card-studio-autosave'
/** V1 draft key, read once so an existing draft survives the upgrade. */
const LEGACY_DRAFT_KEY = 'waqf-card-studio-draft'

const MAX_TEXT = 2000
const MAX_FIELD = 200

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

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

const FRAMES = ['square', 'portrait', 'story'] as const
const FORMATS = ['png', 'jpeg', 'webp'] as const
const RESOLUTIONS = ['full', 'compact'] as const
const DIGITS = ['latn', 'arab'] as const
const LAYOUTS = ['classic', 'feature'] as const

export function sanitizeStyle(raw: unknown): CardStyle {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STYLE }
  const r = raw as Record<string, unknown>
  return {
    template:
      typeof r.template === 'string' && isValidTemplateId(r.template)
        ? r.template
        : DEFAULT_TEMPLATE_ID,
    frame: oneOf(r.frame, FRAMES, DEFAULT_STYLE.frame),
    // `null`/absent both mean "follow the template"; only an unknown value
    // falls back to the explicit variant.
    layout: r.layout === undefined || r.layout === null ? null : oneOf(r.layout, LAYOUTS, 'classic'),
    format: oneOf(r.format, FORMATS, DEFAULT_STYLE.format),
    resolution: oneOf(r.resolution, RESOLUTIONS, DEFAULT_STYLE.resolution),
    digits: oneOf(r.digits, DIGITS, DEFAULT_STYLE.digits),
  }
}

function str(value: unknown, max = MAX_FIELD): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.length > max) return null
  return value
}

function int(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  return value >= min && value <= max ? value : null
}

export function sanitizeBlocks(raw: unknown): CardBlock[] {
  if (!Array.isArray(raw)) return []
  const out: CardBlock[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const b = entry as Record<string, unknown>
    const id = str(b.id, 64)
    if (!id) continue
    if (b.kind === 'ayah') {
      const surah = int(b.surah, 1, 114)
      const ayahStart = int(b.ayahStart, 1, 286)
      const ayahEnd = int(b.ayahEnd, 1, 286)
      if (surah === null || ayahStart === null || ayahEnd === null) continue
      out.push({ id, kind: 'ayah', surah, ayahStart, ayahEnd })
    } else if (b.kind === 'dua') {
      const duaId = str(b.duaId, 64)
      if (!duaId) continue
      out.push({ id, kind: 'dua', duaId })
    } else if (b.kind === 'quote') {
      if (typeof b.quoteId === 'string' && b.quoteId.trim() !== '') {
        out.push({ id, kind: 'quote', quoteId: b.quoteId })
        continue
      }
      const m = b.manual
      if (!m || typeof m !== 'object') continue
      const manual = m as Record<string, unknown>
      const text = str(manual.text, MAX_TEXT)
      const author = str(manual.author)
      const work = str(manual.work)
      const locator = str(manual.locator)
      if (!text || !author || !work || !locator) continue
      out.push({ id, kind: 'quote', manual: { text, author, work, locator } })
    }
  }
  return out.slice(0, MAX_BLOCKS)
}

/**
 * Project vault for V2: the card document reaches localStorage only behind an
 * explicit opt-in. Style preferences persist like other tools' display
 * preferences. A V1 draft is migrated once, on first load after the upgrade.
 */
export function useCardStudioProject() {
  const [style, setStyleState] = useState<CardStyle>(DEFAULT_STYLE)
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    historyFrom({ blocks: [], style: DEFAULT_STYLE }),
  )
  const [autosave, setAutosave] = useState(false)

  useEffect(() => {
    try {
      const prefs = readJSON<unknown>(PREFS_KEY)
      if (prefs) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
        setStyleState(sanitizeStyle(prefs))
      }
      if (localStorage.getItem(AUTOSAVE_KEY) === '1') {
        setAutosave(true)
        const stored = readJSON<unknown>(PROJECT_KEY)
        if (stored) {
          const record = stored as { blocks?: unknown; style?: unknown }
          dispatch({
            type: 'replace',
            doc: { blocks: sanitizeBlocks(record.blocks), style: sanitizeStyle(record.style) },
          })
        } else {
          // One-time migration from the V1 draft key.
          const legacy = readJSON<unknown>(LEGACY_DRAFT_KEY)
          if (legacy) {
            const record = legacy as { blocks?: unknown; style?: unknown }
            dispatch({
              type: 'replace',
              doc: { blocks: sanitizeBlocks(record.blocks), style: sanitizeStyle(record.style) },
            })
          }
        }
      }
    } catch {
      // ignore — private mode stays in-memory
    }
  }, [])

  // Prefs always persist; the document only behind the opt-in.
  useEffect(() => {
    writeJSON(PREFS_KEY, style)
  }, [style])

  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, autosave ? '1' : '0')
    } catch {
      // ignore
    }
    if (!autosave) return
    writeJSON(PROJECT_KEY, { blocks: state.present.blocks, style: state.present.style })
  }, [autosave, state])

  const setStyle = useCallback((next: CardStyle) => {
    setStyleState(next)
    dispatch({ type: 'style', style: next })
  }, [])

  const clearProject = useCallback(() => {
    dispatch({ type: 'reset', doc: { blocks: [], style: state.present.style } })
    try {
      localStorage.removeItem(PROJECT_KEY)
      localStorage.removeItem(LEGACY_DRAFT_KEY)
    } catch {
      // ignore
    }
  }, [state.present.style])

  return {
    state: state as HistoryState,
    dispatch,
    style: state.present.style,
    setStyle,
    blocks: state.present.blocks,
    autosave,
    setAutosave,
    clearProject,
  }
}
