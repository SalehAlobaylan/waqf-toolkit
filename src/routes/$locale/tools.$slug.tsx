import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useI18n, lhref, hreflangLinks, type Locale } from '@/i18n'
import { getTool, localizedTool, relatedTools } from '@/data/tools'
import { TOOL_INTERFACES } from '@/tools/registry'
import { ButtonLink, Eyebrow } from '@/components/ui'
import { CategoryTile, StatusPill, SaveButton, ToolCard } from '@/components/tool-card'
import { GITHUB_REPO_URL } from '@/components/site-chrome'
import { useSavedTools } from '@/lib/saved-tools'
import { ArrowLeftIcon, ArrowRightIcon, ShieldCheckIcon } from '@/components/icons'
import { GithubIcon } from '@/components/github-icon'

export const Route = createFileRoute('/$locale/tools/$slug')({
  beforeLoad: ({ params }) => {
    if (!getTool(params.slug)) {
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
        ...(text
          ? [{ name: 'description', content: text.shortDescription }]
          : []),
      ],
      links: hreflangLinks(`/tools/${params.slug}`),
    }
  },
  component: ToolDetailPage,
})

function ToolDetailPage() {
  const { locale, t } = useI18n()
  const { slug } = Route.useParams()
  const tool = getTool(slug)!
  const text = localizedTool(tool, locale)
  const ToolInterface = TOOL_INTERFACES[slug]
  const related = relatedTools(tool)
  const saved = useSavedTools()
  return (
    <main className="mx-auto max-w-[860px] px-5 pb-20 pt-6 lg:px-8 lg:pt-8">
      <Link
        to="/$locale/tools"
        params={{ locale }}
        data-testid="link-back-tools"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {t.directory.backToDirectory}
      </Link>

      <div className="mt-6">
        <div>
          <div className="flex items-center gap-3">
            <CategoryTile category={tool.category} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="eyebrow text-muted">{t.category[tool.category]}</span>
                <StatusPill status={tool.status} />
              </div>
              <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-[-0.03em] rtl:tracking-normal sm:text-[32px]">
                {text.name}
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted">
            {text.shortDescription}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {tool.tryRoute && !ToolInterface && (
              <ButtonLink
                href={lhref(`/tools/${tool.slug}/try`, locale)}
                data-testid={`button-primary-${tool.slug}`}
                className="group gap-3"
              >
                {t.tool.openTool}
                <ArrowRightIcon className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </ButtonLink>
            )}
            {!tool.tryRoute && tool.trackingIssue && (
              <ButtonLink
                href={`${GITHUB_REPO_URL}/issues/${tool.trackingIssue}`}
                external
                variant="muted"
                data-testid={`button-primary-${tool.slug}`}
                className="group gap-3"
              >
                {t.tool.viewPlan}
                <ArrowRightIcon className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </ButtonLink>
            )}
            <SaveButton
              saved={saved.isSaved(tool.slug)}
              onToggle={() => saved.toggle(tool.slug)}
              slug={tool.slug}
            />
            {tool.repoUrl && (
              <ButtonLink
                href={tool.repoUrl}
                external
                variant="outline"
                data-testid={`link-repo-${tool.slug}`}
                className="gap-2 px-4 py-3 text-xs font-medium"
              >
                <GithubIcon className="h-4 w-4" />
                {t.contribute.viewOnGithub}
              </ButtonLink>
            )}
          </div>

          {/* Runnable interface, embedded for zero extra clicks */}
          {ToolInterface && (
            <div
              className="mt-6 overflow-hidden rounded-xl border border-line/70"
              data-testid={`panel-embed-${tool.slug}`}
            >
              <div className="flex items-center justify-between border-b border-line/60 bg-accent-soft/20 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-accent" />
                  {text.name}
                </span>
                <span className="eyebrow text-accent">{t.tryTool.title}</span>
              </div>
              <div className="bg-surface/50 p-4 sm:p-5">
                <ToolInterface />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related tools */}
      <section className="mt-10 border-t border-line pt-8">
        <Eyebrow>{t.tool.relatedTitle}</Eyebrow>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((candidate) => (
            <ToolCard
              key={candidate.slug}
              tool={candidate}
              saved={saved.isSaved(candidate.slug)}
              onToggleSave={saved.toggle}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
