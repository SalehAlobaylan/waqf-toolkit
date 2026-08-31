import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useI18n, hreflangLinks, type Locale } from '@/i18n'
import { getTool, localizedTool } from '@/data/tools'
import { TOOL_INTERFACES } from '@/tools/registry'
import { CategoryTile, StatusPill } from '@/components/tool-card'
import { ArrowLeftIcon, ShieldCheckIcon } from '@/components/icons'

export const Route = createFileRoute('/$locale/tools/$slug_/try')({
  beforeLoad: ({ params }) => {
    const tool = getTool(params.slug)
    if (!tool || !TOOL_INTERFACES[params.slug]) {
      throw notFound()
    }
  },
  head: ({ params }) => {
    const tool = getTool(params.slug)
    const locale: Locale = params.locale === 'ar' ? 'ar' : 'en'
    const text = tool ? localizedTool(tool, locale) : undefined
    return {
      meta: [
        {
          title: text
            ? locale === 'ar'
              ? `${text.name} — صندوق وقف`
              : `${text.name} — Waqf Toolkit`
            : 'Waqf Toolkit',
        },
      ],
      links: hreflangLinks(`/tools/${params.slug}/try`),
    }
  },
  component: TryToolPage,
})

function TryToolPage() {
  const { locale, t } = useI18n()
  const { slug } = Route.useParams()
  const ToolInterface = TOOL_INTERFACES[slug]!
  const tool = getTool(slug)!
  const text = localizedTool(tool, locale)

  return (
    <main className="mx-auto max-w-[860px] px-5 pb-20 pt-8 lg:px-8 lg:pt-10">
      <Link
        to="/$locale/tools/$slug"
        params={{ locale, slug: tool.slug }}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {text.name}
      </Link>

      <div className="mt-8 flex flex-wrap items-start gap-4">
        <CategoryTile category={tool.category} large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-muted">{t.category[tool.category]}</span>
            <StatusPill status={tool.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-[0.06em] text-accent">
              <ShieldCheckIcon className="h-3 w-3" />
            </span>
          </div>
          <h1 className="mt-3 font-display text-[32px] font-semibold leading-none tracking-[-0.04em] rtl:tracking-normal sm:text-5xl">
            {text.name}
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted">{text.shortDescription}</p>
        </div>
      </div>

      <div className="glass-panel mt-8 overflow-hidden rounded-[24px] border border-line/70" data-testid={`panel-try-${tool.slug}`}>
        <div className="p-6 sm:p-8">
          <ToolInterface />
        </div>
        <div className="border-t border-line/50 bg-accent-soft/20 px-6 py-3">
          <p className="text-xs leading-5 text-muted">
            <span className="font-semibold text-ink">{t.tool.processingNote}:</span> {text.processingNote}
          </p>
        </div>
      </div>
    </main>
  )
}
