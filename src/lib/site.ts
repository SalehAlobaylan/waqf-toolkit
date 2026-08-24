/** Canonical origin for absolute URLs (hreflang, OG). */
export const SITE_URL = (
  (globalThis.process?.env?.SITE_URL as string | undefined) ??
  'https://waqf-toolkit.vercel.app'
).replace(/\/$/, '')
