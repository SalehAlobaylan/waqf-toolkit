import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useI18n, lhref } from '@/i18n'
import { getTool } from '@/data/tools'
import { TOOL_INTERFACES } from '@/tools/registry'
import { Card } from '@/components/ui'

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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        to={lhref(`/tools/${tool.slug}`, locale)}
        className="text-sm text-muted hover:text-ink"
      >
        ← {tool.name}
      </Link>

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {tool.name} — <span className="text-accent">{t.tryTool.title}</span>
        </h1>
        <p className="mt-2 text-muted">{tool.shortDescription}</p>
      </div>

      <Card className="p-6">
        <ToolInterface />
      </Card>
    </div>
  )
}
