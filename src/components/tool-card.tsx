import { Link } from '@tanstack/react-router'
import { useI18n } from '@/i18n'
import { localizedTool, type Tool, type ToolCategory, type ToolStatus } from '@/data/tools'
import { useSheen } from '@/lib/use-sheen'
import { ArrowRightIcon, FilmIcon, ShieldIcon, FileTextIcon, ClockIcon, StarIcon } from './icons'

const CATEGORY_ICONS: Record<ToolCategory, typeof FilmIcon> = {
  Media: FilmIcon,
  Privacy: ShieldIcon,
  Documents: FileTextIcon,
  Everyday: ClockIcon,
}

/** Rounded icon tile representing the tool's category. */
export function CategoryTile({
  category,
  large = false,
}: {
  category: ToolCategory
  large?: boolean
}) {
  const Icon = CATEGORY_ICONS[category]
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border text-accent [&>svg]:stroke-[1.5] ${
        large
          ? 'h-16 w-16 border-white/70 bg-surface/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md'
          : 'h-9 w-9 border-line/80 bg-accent-soft/60'
      }`}
    >
      <Icon className={large ? 'h-7 w-7' : 'h-4 w-4'} />
    </span>
  )
}

export function StatusPill({ status }: { status: ToolStatus }) {
  const { t } = useI18n()
  const tones: Record<ToolStatus, string> = {
    available: 'bg-accent/10 text-accent',
    experimental: 'bg-clay-soft text-[hsl(24_52%_38%)]',
    planned: 'bg-line/60 text-muted',
  }
  const dots: Record<ToolStatus, string> = {
    available: 'bg-accent',
    experimental: 'bg-clay',
    planned: 'bg-muted',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-[0.08em] rtl:[letter-spacing:normal] ${tones[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} aria-hidden="true" />
      {t.status[status]}
    </span>
  )
}

export function SaveButton({
  saved,
  onToggle,
  slug,
  compact = false,
}: {
  saved: boolean
  onToggle: () => void
  slug: string
  compact?: boolean
}) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={saved ? t.tool.savedTool : t.tool.saveTool}
      aria-pressed={saved}
      data-testid={`button-save-${slug}`}
      className={`group cursor-pointer rounded-full border transition-colors ${
        compact
          ? 'p-2'
          : 'flex items-center gap-2 px-3 py-2 text-xs'
      } ${
        saved
          ? 'border-accent/30 bg-accent-soft text-accent'
          : 'border-line text-muted hover:border-accent/35 hover:text-accent'
      }`}
    >
      <StarIcon
        filled={saved}
        className={`h-4 w-4 transition-transform group-hover:-translate-y-0.5`}
      />
      {!compact && (saved ? t.tool.savedTool : t.tool.saveTool)}
    </button>
  )
}

export function ToolCard({
  tool,
  saved,
  onToggleSave,
}: {
  tool: Tool
  saved: boolean
  onToggleSave: (slug: string) => void
}) {
  const { locale, t } = useI18n()
  const sheen = useSheen<HTMLElement>()
  const text = localizedTool(tool, locale)
  return (
    <article
      data-testid={`card-tool-${tool.slug}`}
      onPointerMove={sheen}
      className={`glass-card group relative flex min-h-[204px] flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-float ${
        tool.status === 'available'
          ? 'border-accent/35 hover:border-accent/60'
          : 'border-line/90 hover:border-accent/35'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <CategoryTile category={tool.category} />
          <span className="relative z-10">
            <SaveButton
              saved={saved}
              onToggle={() => onToggleSave(tool.slug)}
              slug={tool.slug}
              compact
            />
          </span>
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          <span className="eyebrow text-muted">{t.category[tool.category]}</span>
          <span className="h-1 w-1 rounded-full bg-line" aria-hidden="true" />
          <StatusPill status={tool.status} />
        </div>
        <Link
          to="/$locale/tools/$slug"
          params={{ locale, slug: tool.slug }}
          data-testid={`link-tool-${tool.slug}`}
          className="mt-2 after:absolute after:inset-0 after:rounded-2xl after:content-['']"
        >
          <h3 className="font-display text-[19px] font-semibold tracking-[-0.03em] transition-colors group-hover:text-accent rtl:tracking-normal">
            {text.name}
          </h3>
          <p className="mt-1 max-w-[30ch] text-[13px] leading-[1.35] text-muted">
            {text.shortDescription}
          </p>
        </Link>
      </div>
      <div className="relative mt-3.5 flex items-center justify-between border-t border-line/70 pt-3">
        <span className="font-mono-ui text-[10px] text-muted">
          {t.tool.updated} {tool.updatedAt}
        </span>
        <Link
          to="/$locale/tools/$slug"
          params={{ locale, slug: tool.slug }}
          data-testid={`link-open-${tool.slug}`}
          className="flex items-center gap-1 text-xs font-semibold text-accent opacity-80 transition-all group-hover:gap-2 group-hover:opacity-100"
        >
          {tool.status === 'available'
            ? t.tool.openToolShort
            : tool.status === 'experimental'
              ? t.tool.tryExperiment
              : t.tool.viewPlan}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}
