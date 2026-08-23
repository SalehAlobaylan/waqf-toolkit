import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'waqf-toolkit:saved-tools'
const CHANGE_EVENT = 'waqf-saved-tools-change'

// Cached snapshot: getSnapshot must return a stable reference between changes.
let snapshot: string[] = []

function refresh(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    snapshot = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    snapshot = []
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
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useSavedTools() {
  const slugs = useSyncExternalStore(subscribe, refresh, () => [])

  const isSaved = useCallback(
    (slug: string) => slugs.includes(slug),
    [slugs],
  )

  const toggle = useCallback((slug: string) => {
    const current = [...refresh()]
    persist(
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    )
  }, [])

  return { savedSlugs: slugs, isSaved, toggle }
}
