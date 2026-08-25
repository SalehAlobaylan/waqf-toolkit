/**
 * Swap the locale segment of a localized path, e.g.
 * switchLocalePath('/en/tools/link-cleaner', 'ar') -> '/ar/tools/link-cleaner'.
 *
 * Used by the header language switch, which must preserve the current path
 * (typed <Link> cannot express that without recomputing params per route).
 */
export function switchLocalePath(pathname: string, nextLocale: string): string {
  const segments = pathname.split('/')
  if (segments.length > 1) {
    segments[1] = nextLocale
  }
  return segments.join('/') || `/${nextLocale}`
}
