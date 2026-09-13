/**
 * ToolResultHero — shared “final conclusion” surface for every tool.
 *
 * Place at position 0 inside each `*-try.tsx` (above inputs) so the answer
 * is visible without scroll. Every tool maps its domain result to the same
 * slots: Header → Accent (live countdown/status) → Progress → Body/Stats/Visual → Meta → Actions.
 *
 * Usage for future tools:
 *   <ToolHero testId="result-my-tool" live>
 *     <ToolHeroHeader eyebrow={t.myTool.resultTitle} meta={`${date} • ${tz}`} badge={<StatusBadge/>} />
 *     <ToolHeroAccent>Next: X in 2h 04m 11s</ToolHeroAccent>
 *     <ToolHeroProgress value={0.42} />
 *     <ToolHeroBody><ToolHeroValue value="42.0" unit="km" testId="value-my" /></ToolHeroBody>
 *     <ToolHeroStats items={[{label:'A', value:'10', active:true}]} />
 *     <ToolHeroMeta>Method • disclaimer</ToolHeroMeta>
 *     <ToolHeroActions><Button>Copy</Button></ToolHeroActions>
 *   </ToolHero>
 *
 * Keep hero presentational: computation stays in `*-try.tsx`; hero only renders.
 * See `src/tools/prayer-times/prayer-times-try.tsx:546` for the reference implementation.
 */
import type { ReactNode } from 'react'

type ToolHeroProps = {
  children: ReactNode
  testId?: string
  live?: boolean
  className?: string
}

export function ToolHero({ children, testId, live, className = '' }: ToolHeroProps) {
  return (
    <div
      className={`glass-panel overflow-hidden rounded-[20px] border border-line/70 ${className}`}
      data-testid={testId}
      aria-live={live ? 'polite' : undefined}
    >
      {children}
    </div>
  )
}

export function ToolHeroHeader({
  eyebrow,
  meta,
  badge,
}: {
  eyebrow: ReactNode
  meta?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-accent-soft/40 px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-semibold">
        {eyebrow}
        {badge ? <span className="inline-flex items-center">{badge}</span> : null}
      </span>
      {meta ? (
        <span className="font-mono-ui text-xs text-muted" dir="ltr">
          {meta}
        </span>
      ) : null}
    </div>
  )
}

export function ToolHeroAccent({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex items-center justify-between gap-2 overflow-hidden border-y border-accent/20 bg-accent/10 px-4 py-2.5 text-xs font-semibold text-accent-strong backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent/10 via-white/20 to-accent/5" />
      <span className="relative flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" aria-hidden="true" />
        {children}
      </span>
    </div>
  )
}

export function ToolHeroProgress({ value }: { value: number | null }) {
  if (value == null) return null
  const width = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className="h-1.5 overflow-hidden bg-line/30 backdrop-blur-sm">
      <div
        className="h-full bg-accent/80 backdrop-blur-md transition-all duration-700"
        style={{ width: `${width.toFixed(1)}%` }}
      />
    </div>
  )
}

export function ToolHeroBody({
  children,
  layout = 'single',
  className = '',
}: {
  children: ReactNode
  layout?: 'single' | 'split' | 'grid'
  className?: string
}) {
  const layouts: Record<string, string> = {
    single: 'p-6',
    grid: 'p-0',
    split: 'grid gap-4 p-6 lg:grid-cols-[1fr_340px] lg:items-start',
  }
  return <div className={`${layouts[layout]} ${className}`}>{children}</div>
}

export function ToolHeroValue({
  label,
  value,
  unit,
  sublabel,
  testId,
  dir = 'ltr',
}: {
  label?: ReactNode
  value: ReactNode
  unit?: ReactNode
  sublabel?: ReactNode
  testId?: string
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div>
      {label ? <p className="eyebrow text-muted">{label}</p> : null}
      <p
        className="mt-1 font-display text-4xl font-semibold tracking-tight"
        dir={dir}
        data-testid={testId}
      >
        {value}
        {unit ? <span className="ms-1.5 text-xl font-medium text-muted">{unit}</span> : null}
      </p>
      {sublabel ? <p className="mt-2 text-xs leading-5 text-muted">{sublabel}</p> : null}
    </div>
  )
}

export function ToolHeroStats({
  items,
  columns = 6,
}: {
  items: Array<{
    label: ReactNode
    value: ReactNode
    testId?: string
    active?: boolean
    sublabel?: ReactNode
  }>
  columns?: 3 | 6
}) {
  const cols = columns === 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'
  return (
    <div className={`grid gap-px bg-line/60 ${cols}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`relative overflow-hidden px-3 py-4 text-center transition-colors ${
            item.active ? 'bg-accent/10 backdrop-blur-xl' : 'bg-surface'
          }`}
        >
          {item.active ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/10 to-accent/5" />
          ) : null}
          <p className={`eyebrow relative ${item.active ? 'text-accent' : 'text-muted'}`}>
            {item.label}
          </p>
          <p
            className={`relative mt-1 font-display text-lg font-semibold ${item.active ? 'text-accent-strong' : ''}`}
            dir="ltr"
            data-testid={item.testId}
          >
            {item.value}
          </p>
          {item.sublabel ? (
            <p className={`relative mt-1 text-[10px] font-bold uppercase tracking-wide ${item.active ? 'text-accent' : 'text-muted'}`}>
              {item.sublabel}
            </p>
          ) : null}
          {item.active ? (
            <p className="relative mt-1 text-[10px] font-bold uppercase tracking-wide text-accent">·</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function ToolHeroMeta({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-line/60 bg-accent-soft/20 px-4 py-3">
      <p className="text-xs leading-5 text-muted">{children}</p>
    </div>
  )
}

export function ToolHeroActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-line/60 bg-surface/40 px-4 py-3">
      {children}
    </div>
  )
}

export function ToolHeroVisual({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-2xl border border-accent/15 bg-accent-soft/30 p-6 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}

export function ToolHeroEmpty({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'warning' | 'danger'
}) {
  const tones: Record<string, string> = {
    muted: 'border-line/60 bg-surface/70 text-muted',
    warning: 'border-amber-300 bg-amber-50/80 text-amber-900',
    danger: 'border-danger/40 bg-clay-soft/80 text-danger',
  }
  return (
    <div
      className={`flex gap-3 rounded-2xl border p-4 backdrop-blur-xl ${tones[tone]}`}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
    >
      <p className="text-xs font-medium leading-5">{children}</p>
    </div>
  )
}
