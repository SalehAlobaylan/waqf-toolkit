import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'waqf-toolkit:saved-tools'
const CHANGE_EVENT = 'waqf-saved-tools-change'

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function write(slugs: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    // Storage unavailable (private mode, quota). Saving is best-effort.
  }
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
  const slugs = useSyncExternalStore(
    subscribe,
    read,
    () => [] as string[],
  )

  const isSaved = useCallback(
    (slug: string) => slugs.includes(slug),
    [slugs],
  )

  const toggle = useCallback((slug: string) => {
    const current = read()
    write(
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug],
    )
  }, [])

  return { savedSlugs: slugs, isSaved, toggle }
}
