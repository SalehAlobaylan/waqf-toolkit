/** Canonical origin for absolute URLs (hreflang, OG, sitemap). */
export const SITE_URL = (
  (globalThis.process?.env?.SITE_URL as string | undefined) ??
  'https://waqf-toolkit.vercel.app'
).replace(/\/$/, '')

/** All statically known routes (locale-relative). */
export const ROUTE_PATHS = [
  '/',
  '/tools',
  '/contribute',
] as const

/** Absolute URL for a locale-relative path in a given locale. */
export function siteUrl(locale: 'en' | 'ar', path = '/'): string {
  return `${SITE_URL}/${locale}${path === '/' ? '' : path}`
}
