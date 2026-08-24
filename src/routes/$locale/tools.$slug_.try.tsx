import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useI18n, hreflangLinks } from '@/i18n'
import { getTool } from '@/data/tools'
import { TOOL_INTERFACES } from '@/tools/registry'
import { Eyebrow } from '@/components/ui'
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
} from '@/components/icons'

export const Route = createFileRoute('/$locale/tools/$slug_/try')({
  beforeLoad: ({ params }) => {
    const tool = getTool(params.slug)
    if (!tool || !TOOL_INTERFACES[params.slug]) {
      throw notFound()
    }
  },
  head: ({ params }) => {
    const tool = getTool(params.slug)
    return {
      meta: [
        {
          title: tool
            ? `${tool.name} — Waqf Toolkit`
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

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 lg:px-8 lg:pt-14">
      <Link
        to="/$locale/tools/$slug"
        params={{ locale, slug: tool.slug }}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {tool.name}
      </Link>

      <div className="mb-8 mt-8 animate-rise">
        <Eyebrow>{t.tryTool.title}</Eyebrow>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] rtl:tracking-normal sm:text-5xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">{tool.shortDescription}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-accent/25 bg-accent-soft/30">
        <div className="flex items-center justify-between border-b border-accent/15 px-5 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheckIcon className="h-4 w-4 text-accent" />
            {tool.name}
          </span>
          <span className="eyebrow text-accent">{t.tryTool.title}</span>
        </div>
        <div className="bg-surface p-5 sm:p-7">
          <ToolInterface />
        </div>
      </div>
    </main>
  )
}
