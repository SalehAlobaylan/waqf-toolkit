import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useI18n, lhref, hreflangLinks, type Locale } from '@/i18n'
import { getTool, localizedTool, relatedTools } from '@/data/tools'
import { TOOL_INTERFACES } from '@/tools/registry'
import { ButtonLink, Eyebrow, InfoCard } from '@/components/ui'
import { CategoryTile, StatusPill, SaveButton, ToolCard } from '@/components/tool-card'
import { GITHUB_REPO_URL } from '@/components/site-chrome'
import { useSavedTools } from '@/lib/saved-tools'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  FileTextIcon,
  LayersIcon,
  CircleCheckIcon,
} from '@/components/icons'
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
  const processingTitle = {
    browser: t.tool.processingBrowser,
    server: t.tool.processingServer,
    'cloud-api': t.tool.processingCloudApi,
  } as const

  return (
    <main className="mx-auto max-w-[1060px] px-5 pb-20 pt-10 lg:px-8 lg:pt-14">
      <Link
        to="/$locale/tools"
        params={{ locale }}
        data-testid="link-back-tools"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {t.directory.backToDirectory}
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <CategoryTile category={tool.category} large />
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-muted">{t.category[tool.category]}</span>
                <StatusPill status={tool.status} />
              </div>
              <h1 className="mt-2 font-display text-5xl font-semibold tracking-[-0.065em] rtl:tracking-normal sm:text-6xl">
                {text.name}
              </h1>
            </div>
          </div>

          <p className="mt-8 max-w-[680px] text-xl leading-8 text-muted">
            {text.description}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
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
              className="mt-10 overflow-hidden rounded-2xl border border-accent/25 bg-accent-soft/30"
              data-testid={`panel-embed-${tool.slug}`}
            >
              <div className="flex items-center justify-between border-b border-accent/15 px-5 py-4">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheckIcon className="h-4 w-4 text-accent" />
                  {text.name}
                </span>
                <span className="eyebrow text-accent">{t.tryTool.title}</span>
              </div>
              <div className="bg-surface/70 p-5 backdrop-blur-sm sm:p-7">
                <ToolInterface />
              </div>
            </div>
          )}

          {/* What to expect */}
          <div className="mt-14 border-t border-line pt-8">
            <Eyebrow>{t.tool.expectEyebrow}</Eyebrow>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={<ShieldCheckIcon className="h-5 w-5" />}
                title={processingTitle[tool.processing]}
                body={text.processingNote}
              />
              {tool.supportedFormats.length > 0 && (
                <InfoCard
                  icon={<FileTextIcon className="h-5 w-5" />}
                  title={t.tool.simpleHandoff}
                  body={t.tool.formatsBody.replace(
                    '{formats}',
                    tool.supportedFormats.join(', '),
                  )}
                />
              )}
              <InfoCard
                icon={<LayersIcon className="h-5 w-5" />}
                title={t.tool.stack}
                body={t.tool.stackBody.replace('{stack}', tool.stack.join(', '))}
              />
              <InfoCard
                icon={<CircleCheckIcon className="h-5 w-5" />}
                title={t.tool.shapeNextTitle}
                body={t.tool.shapeNextBody}
              />
            </div>
          </div>

          {!tool.repoUrl && (
            <div className="mt-10 rounded-2xl border border-dashed border-line p-6">
              <p className="text-sm leading-relaxed text-muted">
                {t.tool.repoUnavailable}
              </p>
              {tool.trackingIssue && (
                <ButtonLink
                  href={`${GITHUB_REPO_URL}/issues/${tool.trackingIssue}`}
                  external
                  variant="outline"
                  className="mt-4 px-4 py-2 text-xs"
                >
                  #{tool.trackingIssue} · {t.tool.roadmap}
                </ButtonLink>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:pt-2">
          <div className="glass-card rounded-2xl border border-line/70 p-5">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-muted">{t.tool.recordEyebrow}</span>
            </div>
            <dl className="mt-6 divide-y divide-line/70">
              {(
                [
                  [t.tool.license, tool.license],
                  [t.tool.updated, tool.updatedAt],
                  [
                    t.tool.formats,
                    tool.supportedFormats.length > 0
                      ? tool.supportedFormats.join(', ')
                      : '—',
                  ],
                  [t.tool.stack, tool.stack.join(', ')],
                  [t.tool.status, t.status[tool.status]],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[82px_1fr] gap-3 py-3 first:pt-0 last:pb-0">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="text-right text-xs font-medium rtl:text-left">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-4 rounded-2xl border border-accent/15 bg-accent-soft/45 p-5 backdrop-blur-md">
            <ShieldCheckIcon className="h-5 w-5 text-accent" />
            <p className="mt-4 text-sm font-semibold">{t.tool.processingNote}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{text.processingNote}</p>
          </div>
        </aside>
      </div>

      {/* Related tools */}
      <section className="mt-16 border-t border-line pt-10">
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
