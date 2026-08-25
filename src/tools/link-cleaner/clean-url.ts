import { TRACKER_PARAMS } from './trackers'

const TRACKER_SET = new Set(TRACKER_PARAMS.map((param) => param.toLowerCase()))

export type CleanUrlResult =
  | {
      ok: true
      /** Cleaned URL string (scheme added if missing). */
      url: string
      /** Query parameter names that were removed, in original order. */
      removed: string[]
    }
  | { ok: false; error: 'invalid-url' }

/**
 * Strip known tracking parameters from a URL.
 *
 * - Scheme is optional; `example.com/a` is treated as `https://example.com/a`.
 * - Matching is case-insensitive.
 * - Path and fragment are never modified. Non-tracker params are kept as-is.
 */
export function cleanUrl(input: string): CleanUrlResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'invalid-url' }

  // Allow scheme-less input like "example.com/page?utm_source=x".
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return { ok: false, error: 'invalid-url' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'invalid-url' }
  }

  const removed: string[] = []
  for (const [name] of parsed.searchParams) {
    if (TRACKER_SET.has(name.toLowerCase())) {
      removed.push(name)
    }
  }
  for (const name of removed) {
    parsed.searchParams.delete(name)
  }

  return { ok: true, url: parsed.toString(), removed }
}
