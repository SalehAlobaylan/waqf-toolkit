import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useI18n, lhref } from '@/i18n'
import { getTool, relatedTools } from '@/data/tools'
import { Badge, Button, Card, ButtonLink } from '@/components/ui'
import { StatusBadge, ToolCard } from '@/components/tool-card'
import { GITHUB_REPO_URL } from '@/components/site-chrome'
import { useSavedTools } from '@/lib/saved-tools'

export const Route = createFileRoute('/$locale/tools/$slug')({
  beforeLoad: ({ params }) => {
    if (!getTool(params.slug)) {
      throw notFound()
    }
  },
  head: ({ params }) => {
    const tool = getTool(params.slug)
    return {
      meta: [
        { title: tool ? `${tool.name} — Waqf Toolkit` : 'Waqf Toolkit' },
        ...(tool
          ? [{ name: 'description', content: tool.shortDescription }]
          : []),
      ],
    }
  },
  component: ToolDetailPage,
})

function ToolDetailPage() {
  const { locale, t } = useI18n()
  const { slug } = Route.useParams()
  const tool = getTool(slug)!
  const saved = useSavedTools()

  const related = relatedTools(tool)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        to={lhref('/tools', locale)}
        className="text-sm text-muted hover:text-ink"
      >
        ← {t.directory.backToDirectory}
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
          <p className="mt-2 text-lg text-muted">{tool.shortDescription}</p>
        </div>
        <Button
          variant={saved.isSaved(tool.slug) ? 'primary' : 'secondary'}
          onClick={() => saved.toggle(tool.slug)}
        >
          {saved.isSaved(tool.slug) ? `★ ${t.tool.savedTool}` : `☆ ${t.tool.saveTool}`}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={tool.status} />
        <Badge>{t.category[tool.category]}</Badge>
        <span className="text-xs text-muted">
          {t.tool.updated}: <time dateTime={tool.updatedAt}>{tool.updatedAt}</time>
        </span>
      </div>

      <p className="mt-8 leading-relaxed">{tool.description}</p>

      {tool.tryRoute && (
        <div className="mt-6">
          <ButtonLink href={lhref(`/tools/${tool.slug}/try`, locale)}>
            {t.tool.openTool} →
          </ButtonLink>
        </div>
      )}

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            {t.tool.stack}
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {tool.stack.map((item) => (
              <Badge key={item} tone="muted">
                {item}
              </Badge>
            ))}
          </dd>
        </Card>

        {tool.supportedFormats.length > 0 && (
          <Card className="p-5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              {t.tool.formats}
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {tool.supportedFormats.map((format) => (
                <Badge key={format} tone="muted">
                  {format}
                </Badge>
              ))}
            </dd>
          </Card>
        )}

        <Card className="p-5">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            {t.tool.license}
          </dt>
          <dd className="mt-2 font-mono text-sm">{tool.license}</dd>
        </Card>

        <Card className="border-accent/30 bg-accent-soft/40 p-5">
          <dt className="text-xs font-medium uppercase tracking-wide text-accent">
            {t.tool.privacyNote}
          </dt>
          <dd className="mt-2 text-sm leading-relaxed">{tool.privacyNote}</dd>
        </Card>
      </dl>

      {/* Source code */}
      <div className="mt-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t.tool.repository}
        </h2>
        {tool.repoUrl ? (
          <div className="mt-3 flex items-center gap-3">
            <ButtonLink href={tool.repoUrl} external variant="secondary">
              GitHub ↗
            </ButtonLink>
            <code className="text-xs text-muted">{tool.repoUrl}</code>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted">{t.tool.repoUnavailable}</p>
            <ButtonLink href={GITHUB_REPO_URL} external variant="secondary">
              {t.contribute.viewOnGithub} ↗
            </ButtonLink>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            {t.tool.relatedTools}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((candidate) => (
              <ToolCard key={candidate.slug} tool={candidate} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
