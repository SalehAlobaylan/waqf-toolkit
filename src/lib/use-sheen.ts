import { useCallback } from 'react'

/**
 * Pointer handler for the liquid-glass specular sheen. Writes
 * --sheen-x/--sheen-y custom properties that `.glass-card::after`
 * renders as a cursor-following highlight. rAF-throttled so rapid
 * pointer movement costs at most one style write per frame.
 */
export function useSheen<T extends HTMLElement>() {
  return useCallback((event: React.PointerEvent<T>) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const x = `${event.clientX - rect.left}px`
    const y = `${event.clientY - rect.top}px`
    if (el.style.getPropertyValue('--sheen-x') === x) {
      el.style.setProperty('--sheen-y', y)
      return
    }
    requestAnimationFrame(() => {
      el.style.setProperty('--sheen-x', x)
      el.style.setProperty('--sheen-y', y)
    })
  }, [])
}
