import { TOOL_LAYOUTS, type ToolTemplate } from '@/lib/panes'
import { REPO_URL } from '@/lib/github'

/**
 * Which template a given path renders with, and the layout facts the site
 * chrome needs before the tool component mounts.
 *
 * This is deliberately a pure pathname lookup rather than a router context
 * flag: the header already derives its transparent variant from
 * `useRouterState(...).location.pathname` (see `components/site-chrome.tsx`),
 * the pathname is available during SSR, and a pure function is testable —
 * none of which a route context value would be.
 */

const TOOL_PATH = /^\/(en|ar)\/tools\/([a-z0-9-]+)\/?$/

/** The `{ locale, slug }` pair for a tool page, or undefined. */
export function toolPathFor(
  pathname: string,
): { locale: string; slug: string } | undefined {
  const match = TOOL_PATH.exec(pathname)
  if (!match) return undefined
  return { locale: match[1], slug: match[2] }
}

export function templateFor(pathname: string): ToolTemplate {
  const match = toolPathFor(pathname)
  if (!match) return 'document'
  return TOOL_LAYOUTS[match.slug]?.template ?? 'document'
}

/** True when the path is a tool page that claims the viewport (no footer). */
export function isAppSurface(pathname: string): boolean {
  return templateFor(pathname) === 'app'
}

/**
 * Repository URL for a tool's METHODOLOGY.md — the document AGENTS.md requires
 * every tool to carry (sources, data versions, calculation rules).
 *
 * The slug is not always the source directory (`prayer-times-widget` lives in
 * `src/tools/prayer-times`), so the registry records the directory.
 */
export function methodologyUrl(slug: string): string | undefined {
  const layout = TOOL_LAYOUTS[slug]
  if (!layout) return undefined
  return `${REPO_URL}/blob/main/src/tools/${layout.dir}/METHODOLOGY.md`
}
