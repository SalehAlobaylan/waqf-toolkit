import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'waqf-toolkit:saved-tools'
export const STORAGE_CHANGE_EVENT = 'waqf-saved-tools-change'

// Stable references required by useSyncExternalStore: the server snapshot
// must be a constant and the client snapshot must not be recreated per call.
const EMPTY: string[] = []
let snapshot: string[] = EMPTY
let loaded = false

/** Load-once read; invalidated by events so getSnapshot stays referentially stable. */
function getSnapshot(): string[] {
  if (!loaded) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      snapshot = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : EMPTY
    } catch {
      snapshot = EMPTY
    }
    loaded = true
  }
  return snapshot
}

function persist(slugs: string[]) {
  snapshot = slugs
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
  } catch {
    // Storage unavailable (private mode, quota). Saving is best-effort.
  }
  window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  // Invalidate before notifying so the next getSnapshot re-reads storage
  // (covers both our own events and cross-tab 'storage' events).
  const handler = () => {
    loaded = false
    onChange()
  }
  window.addEventListener(STORAGE_CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(STORAGE_CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

const getServerSnapshot = () => EMPTY

export function useSavedTools() {
  const savedSlugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isSaved = useCallback(
    (slug: string) => savedSlugs.includes(slug),
    [savedSlugs],
  )

  const toggle = useCallback((slug: string) => {
    const current = [...getSnapshot()]
    persist(
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    )
  }, [])

  return { savedSlugs, isSaved, toggle }
}

/** @internal test isolation helper */
export function __resetSavedToolsForTests() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  snapshot = EMPTY
  loaded = false
}
