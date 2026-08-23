import { createFileRoute, Link } from '@tanstack/react-router'
import { useI18n, lhref } from '@/i18n'
import { TOOLS, STATUS_ORDER } from '@/data/tools'
import { ButtonLink, Card } from '@/components/ui'
import { ToolCard } from '@/components/tool-card'
import { useRepoStats } from '@/lib/use-github'

export const Route = createFileRoute('/$locale/')({
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.locale === 'ar'
            ? 'صندوق وقف — أدوات مفتوحة بوظيفة واضحة'
            : 'Waqf Toolkit — Open tools with a clear job',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const { locale, t } = useI18n()
  const stats = useRepoStats()
  const featured = TOOLS.filter((tool) => tool.featured)

  const principles = [
    { title: t.home.principle1Title, body: t.home.principle1Body },
    { title: t.home.principle2Title, body: t.home.principle2Body },
    { title: t.home.principle3Title, body: t.home.principle3Body },
    { title: t.home.principle4Title, body: t.home.principle4Body },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {t.home.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            {t.site.tagline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={lhref('/tools', locale)}>
              {t.home.browseTools}
            </ButtonLink>
            <ButtonLink href="#principles" variant="secondary">
              {t.home.readPrinciples}
            </ButtonLink>
          </div>

          <RepoStatsStrip />
        </div>
      </section>

      {/* Featured tools */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t.home.featuredTitle}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted">
              {t.home.featuredSubtitle}
            </p>
          </div>
          <Link
            to={lhref('/tools', locale)}
            className="shrink-0 text-sm font-medium text-accent hover:underline"
          >
            {t.home.viewAllTools} →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* Principles */}
      <section id="principles" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16 scroll-mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.home.principlesTitle}
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted">
            {t.home.principlesSubtitle}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {principles.map((principle, index) => (
              <Card key={index} className="p-5">
                <h3 className="font-semibold">{principle.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {principle.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Suggest CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-line bg-accent-soft/50 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t.home.suggestTitle}
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              {t.home.suggestBody}
            </p>
          </div>
          <ButtonLink href={lhref('/contribute', locale)} className="shrink-0">
            {t.home.suggestCta}
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}

function RepoStatsStrip() {
  const { t } = useI18n()
  const query = useRepoStats()

  if (query.isPending) {
    return (
      <div className="mt-12 flex gap-10 opacity-40" aria-hidden="true">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-6 w-10 animate-pulse rounded bg-line" />
            <div className="h-3 w-16 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
    )
  }

  if (query.isError || !query.data) {
    return null
  }

  const items = [
    { value: query.data.stars, label: t.home.statsStars },
    { value: query.data.forks, label: t.home.statsForks },
    { value: query.data.openIssues, label: t.home.statsIssues },
    { value: query.data.contributors, label: t.home.statsContributors },
  ]

  return (
    <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <dd className="text-2xl font-semibold tabular-nums">{item.value}</dd>
          <dt className="text-xs uppercase tracking-wide text-muted">
            {item.label}
          </dt>
        </div>
      ))}
    </dl>
  )
}
