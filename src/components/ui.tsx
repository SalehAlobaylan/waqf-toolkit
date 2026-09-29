import { Link } from '@tanstack/react-router'
import { createContext, useContext, type ReactNode } from 'react'
import type { PaneId, ToolLayout as WorkspaceLayout } from '@/lib/panes'

export type ButtonVariant = 'primary' | 'outline' | 'muted' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-paper shadow-card hover:bg-accent-strong hover:-translate-y-0.5',
  outline:
    'border border-line/80 bg-surface/60 text-ink backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] hover:border-accent/40 hover:text-accent',
  muted: 'bg-[hsl(42_20%_89%)] text-ink hover:brightness-95',
  ghost: 'bg-transparent text-muted hover:bg-line/40 hover:text-ink',
}

export const buttonShape =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45'

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: {
  children: ReactNode
  variant?: ButtonVariant
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${buttonShape} ${buttonStyles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  href,
  variant = 'primary',
  className = '',
  external = false,
  ...rest
}: {
  children: ReactNode
  href: string
  variant?: ButtonVariant
  className?: string
  external?: boolean
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const styles = `${buttonShape} ${buttonStyles[variant]} ${className}`
  if (external || href.startsWith('#') || href.startsWith('http')) {
    return (
      <a
        href={href}
        className={styles}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={styles} {...rest}>
      {children}
    </Link>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`glass-card rounded-2xl border border-line/70 ${className}`}>
      {children}
    </div>
  )
}

/** Mono micro-label in the primary green — no decoration. */
export function Eyebrow({
  children,
  tone = 'accent',
  className = '',
}: {
  children: ReactNode
  tone?: 'accent' | 'olive' | 'muted'
  className?: string
}) {
  const tones = {
    accent: 'text-accent',
    olive: 'text-olive',
    muted: 'text-muted',
  }
  return <p className={`eyebrow ${tones[tone]} ${className}`}>{children}</p>
}

/**
 * Small bordered info tile with an icon, a title, and a line of body copy.
 * `dark` renders it on forest-green surfaces.
 */
export function InfoCard({
  icon,
  title,
  body,
  dark = false,
  className = '',
}: {
  icon: ReactNode
  title: ReactNode
  body: ReactNode
  dark?: boolean
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        dark
          ? 'border-forest-border bg-forest-accent/45'
          : 'glass-card border-line/70'
      } ${className}`}
    >
      <div className={dark ? 'text-olive' : 'text-accent'}>{icon}</div>
      <h3 className="mt-6 text-sm font-semibold">{title}</h3>
      <p
        className={`mt-2 text-xs leading-5 ${
          dark ? 'text-paper/60' : 'text-muted'
        }`}
      >
        {body}
      </p>
    </div>
  )
}

export const inputClasses =
  'w-full rounded-xl border border-line/80 bg-surface/70 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10'

/* ---------------------------------------------------------------------------
   Workspace — the pane frame for the app template.

   The shell owns *space* (width, height, scroll ownership). A tool owns
   *arrangement* (which regions it has, and what goes in them). That split is
   the whole design: before it, the shell implicitly owned arrangement too, by
   refusing the tool any horizontal room.

   Deliberately STATELESS. A pane switcher would change the sub-`lg` flow,
   which is already correct — so below `lg` the panes simply stack in DOM
   source order and the window scrolls.

   Each pane is a `@container`. Without that, every `sm:grid-cols-3` inside a
   tool fires on the VIEWPORT and lands in a 300px rail: 90px-wide fields and
   65px-wide thumbnails. Internal grids must use `@lg:`/`@2xl:` style
   container variants so they respond to the pane.

   The grid tracks are derived from the `panes` array, which is also the DOM
   order a tool must render in. Deriving both from one list is what keeps
   auto-placement from quietly disagreeing with the declaration.
--------------------------------------------------------------------------- */

const paneSurface = 'min-w-0 min-h-0 bg-[var(--surface-pane)]'

/**
 * Trailing-edge divider per pane, in LOGICAL properties so `dir="rtl"`
 * mirrors for free. `grid-cols-*` is physical, so a tool's first pane lands
 * on the right in Arabic — which is the start side, and the correct
 * convention. Never use `left-`/`right-` inside a workspace.
 */
const paneDivider: Record<PaneId, string> = {
  panel: 'border-b border-line/70 lg:border-b-0 lg:border-e',
  stage: 'border-b border-line/70',
  inspector: 'border-b border-line/70 xl:border-s',
}

const paneLabel: Record<PaneId, string> = {
  panel: 'Controls',
  stage: 'Result',
  inspector: 'Options',
}

/**
 * Grid templates per pane combination, keyed by declared order plus the
 * `wide`/`defer` choices.
 *
 * These are written out in full rather than assembled from fragments on
 * purpose: Tailwind extracts class names by scanning source text, so a
 * template literal like `lg:grid-cols-[${tracks}]` produces NO css at all —
 * the workspace would silently collapse to one column at every width. Any new
 * combination must be added here as a literal, and `lib/panes.test.ts` fails
 * the build if a declared layout has no entry.
 *
 * The middle pane takes the slack (`minmax(0,1fr)`); the other two take fixed
 * tracks, `wide` picking the larger of the two. Only three panes get a third
 * column, and `defer` decides which one waits for `xl` — deferring the wrong
 * pane is how you end up hiding the artifact on a 1024px screen.
 */
const WORKSPACE_GRID: Record<string, string> = {
  'stage,panel|-|-':
    'lg:grid-cols-[minmax(0,1fr)_var(--pane-w)]',
  'panel,stage|-|-':
    'lg:grid-cols-[var(--pane-w)_minmax(0,1fr)]',
  'stage,panel,inspector|-|inspector':
    'lg:grid-cols-[minmax(0,1fr)_var(--pane-w)] xl:grid-cols-[minmax(0,1fr)_var(--pane-w)_var(--pane-inspector-w)]',
  'panel,stage,inspector|-|inspector':
    'lg:grid-cols-[var(--pane-w)_minmax(0,1fr)] xl:grid-cols-[var(--pane-w)_minmax(0,1fr)_var(--pane-inspector-w)]',
  // Card Studio: the picker is the work, so it keeps the slack at every width
  // and the preview keeps a column. At `lg` the assembly rail is what gives way.
  'panel,stage,inspector|inspector|panel':
    'lg:grid-cols-[minmax(0,1fr)_var(--pane-preview-w)] xl:grid-cols-[var(--pane-w)_minmax(0,1fr)_var(--pane-preview-w)]',
}

/** Which pane waits for `xl` when the workspace has three. */
export function deferredPane(panes: readonly PaneId[], defer?: PaneId): PaneId | undefined {
  return panes.length > 2 ? (defer ?? 'inspector') : undefined
}

export function workspaceGridClasses(layout: WorkspaceLayout, bleed = false) {
  const { panes, wide } = layout
  const defer = deferredPane(panes, layout.defer)
  const key = `${panes.join(',')}|${wide ?? '-'}|${defer ?? '-'}`
  const grid =
    WORKSPACE_GRID[key] ??
    // Unreachable while every combination is a literal; a single column still
    // stacks correctly rather than rendering an unstyled grid.
    ''
  return [
    'tool-workspace grid min-h-0 grid-cols-1',
    grid,
    'lg:h-[var(--app-h)] lg:overflow-hidden',
    bleed ? 'w-full' : 'mx-auto w-full max-w-[var(--shell-w)]',
  ]
    .filter(Boolean)
    .join(' ')
}

const WorkspaceContext = createContext<WorkspaceLayout>({
  template: 'app',
  panes: ['panel', 'stage', 'inspector'],
  dir: '',
})

export function Workspace({
  layout,
  bleed = false,
  bar,
  className = '',
  children,
}: {
  layout: WorkspaceLayout
  bleed?: boolean
  /** Full-width action row above the grid, outside the height budget. */
  bar?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={bar ? 'tool-workspace-frame' : undefined}>
      {bar}
      <WorkspaceContext.Provider value={layout}>
        <div className={`${workspaceGridClasses(layout, bleed)} ${className}`}>
          {children}
        </div>
      </WorkspaceContext.Provider>
    </div>
  )
}

Workspace.Pane = function WorkspacePane({
  id,
  label,
  fill = false,
  className = '',
  children,
}: {
  id: PaneId
  label?: string
  /**
   * The artifact pane: it fills its cell and does not scroll, because the
   * canvas inside it manages its own fit. Not implied by the id — Card Studio's
   * canvas is a side rail, not the stage.
   */
  fill?: boolean
  className?: string
  children: ReactNode
}) {
  const layout = useContext(WorkspaceContext)
  const deferred = id === deferredPane(layout.panes, layout.defer)
  return (
    <section
      aria-label={label ?? paneLabel[id]}
      data-pane={id}
      className={`tool-pane @container ${paneSurface} ${paneDivider[id]} ${
        deferred ? 'lg:hidden xl:block' : ''
      } ${
        fill
          ? 'overflow-hidden p-3 sm:p-4 lg:p-5'
          : 'lg:overflow-y-auto lg:overscroll-contain p-4 sm:p-5'
      } ${className}`}
    >
      {children}
    </section>
  )
}

