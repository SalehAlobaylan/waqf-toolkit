import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useI18n, hreflangLinks } from '@/i18n'
import { localizedTool, STATUS_ORDER, TOOLS, type ToolStatus } from '@/data/tools'
import { ButtonLink, Eyebrow, InfoCard } from '@/components/ui'
import { CategoryTile, ToolCard } from '@/components/tool-card'
import { StatusDot } from '@/components/site-chrome'
import { useSavedTools } from '@/lib/saved-tools'
import {
  ArrowRightIcon,
  SearchIcon,
  ShieldCheckIcon,
  CircleCheckIcon,
  CodeIcon,
  SparklesIcon,
} from '@/components/icons'

/** Most important + most usable tools for the hero card: available first. */
const USABLE_TOOLS = TOOLS.filter((tool) => tool.status !== 'planned')
  .sort(
    (a, b) =>
      STATUS_ORDER.indexOf(a.status as ToolStatus) -
        STATUS_ORDER.indexOf(b.status as ToolStatus) ||
      b.updatedAt.localeCompare(a.updatedAt),
  )
  .slice(0, 3)

export const Route = createFileRoute('/$locale/')({
  head: ({ params }) => {
    const locale = params.locale === 'ar' ? 'ar' : 'en'
    return {
      meta: [
        {
          title:
            locale === 'ar'
              ? 'صندوق وقف — أدوات مفتوحة بوظيفة واضحة'
              : 'Waqf Toolkit — Open tools with a clear job',
        },
      ],
      links: hreflangLinks('/'),
    }
  },
  component: HomePage,
})

function HomePage() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const [heroQuery, setHeroQuery] = useState('')
  const featured = TOOLS.filter((tool) => tool.featured)

  return (
    <main>
      {/* Hero */}
      <section className="shell-grid relative overflow-hidden border-b border-line/70">
        <div className="mx-auto grid max-w-[1240px] items-end gap-12 px-5 py-12 lg:grid-cols-[1fr_390px] lg:px-8 lg:py-16">
          <div className="animate-rise">
            <div className="mb-4 flex items-center gap-3 text-xs text-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                <SparklesIcon className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono-ui font-bold uppercase tracking-[0.12em] rtl:[letter-spacing:normal]">
                {t.home.heroKicker}
              </span>
            </div>
            <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[0.95] tracking-[-0.05em] rtl:max-w-none rtl:leading-[1.15] rtl:tracking-normal">
              {t.home.heroLine1}
              <br />
              <span className="text-accent">{t.home.heroLine2}</span>
            </h1>
            <p className="mt-4 max-w-[530px] text-sm leading-6 text-muted sm:text-base">
              {t.home.heroSubtitle}
            </p>
            <form
              className="mt-5 flex w-full max-w-[420px] items-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 shadow-card transition-colors focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10"
              onSubmit={(event) => {
                event.preventDefault()
                const q = heroQuery.trim()
                if (!q) return
                navigate({ to: '/$locale/tools', params: { locale }, search: { q } })
              }}
            >
              <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
              <input
                value={heroQuery}
                onChange={(event) => setHeroQuery(event.target.value)}
                type="search"
                placeholder={t.directory.searchPlaceholder}
                aria-label={t.directory.searchPlaceholder}
                data-testid="input-hero-search"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
              />
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={`/${locale}/tools`}
                variant="outline"
                data-testid="link-hero-browse"
                className="group gap-3"
              >
                {t.home.browseTools}
                <ArrowRightIcon className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/contribute`}
                variant="outline"
                data-testid="link-hero-contribute"
              >
                {t.home.buildWithUs}
              </ButtonLink>
            </div>
          </div>

          {/* Usable tools card — same forest design, tools instead of steps */}
          <div className="relative animate-rise" style={{ animationDelay: '120ms' }}>
            <div className="relative overflow-hidden rounded-[26px] border border-accent/20 bg-forest p-6 text-paper shadow-float">
              <div
                aria-hidden="true"
                className="absolute -end-16 -top-16 h-48 w-48 rounded-full border-[24px] border-olive/20"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 -start-8 h-48 w-48 rounded-full border border-olive/20"
              />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-forest-border pb-4">
                  <span className="eyebrow text-olive">{t.home.mostUsed}</span>
                  <SparklesIcon className="h-4 w-4 text-paper/45" />
                </div>
                <ul className="mt-3">
                  {USABLE_TOOLS.map((tool) => {
                    const toolText = localizedTool(tool, locale)
                    return (
                      <li key={tool.slug}>
                        <Link
                          to="/$locale/tools/$slug"
                          params={{ locale, slug: tool.slug }}
                          data-testid={`hero-tool-${tool.slug}`}
                          className="group -mx-2 flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/5"
                        >
                          <CategoryTile category={tool.category} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold">
                                {toolText.name}
                              </span>
                              <StatusDot status={tool.status} />
                            </span>
                            <span className="mt-0.5 block truncate text-xs leading-5 text-paper/60">
                              {toolText.shortDescription}
                            </span>
                          </span>
                          <ArrowRightIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-paper/45 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                <Link
                  to="/$locale/tools"
                  params={{ locale }}
                  data-testid="link-hero-all-tools"
                  className="mt-2 flex items-center justify-between gap-2 rounded-xl border-t border-forest-border px-2 pb-1 pt-4 text-xs font-semibold text-olive transition-colors hover:text-paper"
                >
                  {t.home.seeAllCount.replace('{count}', String(TOOLS.length))}
                </Link>
              </div>
            </div>
            <span className="absolute -bottom-5 -start-5 hidden rounded-xl border border-line bg-surface px-4 py-3 text-xs shadow-card sm:block">
              <span className="me-2 inline-block h-2 w-2 rounded-full bg-accent" />
              {t.home.noAccount}
            </span>
          </div>
        </div>
      </section>

      {/* Featured tools */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>{t.home.featuredEyebrow}</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] rtl:tracking-normal sm:text-5xl">
              {t.home.featuredHeading}
            </h2>
          </div>
          <Link
            to="/$locale/tools"
            params={{ locale }}
            className="flex items-center gap-2 text-sm font-semibold text-accent transition-all hover:gap-3"
          >
            {t.home.seeAllCount.replace('{count}', String(TOOLS.length))}
            <ArrowRightIcon />
          </Link>
        </div>
        <div className="mt-9 grid gap-3 lg:grid-cols-3">
          {featured.map((tool, index) => (
            <div
              key={tool.slug}
              className="animate-rise"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <FeaturedCard slug={tool.slug} />
            </div>
          ))}
        </div>
      </section>

      {/* Privacy band */}
      <section className="bg-forest text-paper">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <p className="eyebrow text-olive">{t.home.privacyEyebrow}</p>
            <h2 className="mt-4 max-w-[420px] font-display text-4xl font-semibold leading-[0.98] tracking-[-0.055em] rtl:tracking-normal sm:text-5xl">
              {t.home.privacyHeading}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard
              dark
              icon={<ShieldCheckIcon className="h-5 w-5" />}
              title={t.home.principle1Title}
              body={t.home.privacyPoint1Body}
            />
            <InfoCard
              dark
              icon={<CircleCheckIcon className="h-5 w-5" />}
              title={t.home.principle2Title}
              body={t.home.privacyPoint2Body}
            />
            <InfoCard
              dark
              icon={<CodeIcon className="h-5 w-5" />}
              title={t.home.principle4Title}
              body={t.home.privacyPoint3Body}
            />
          </div>
        </div>
      </section>

      {/* Suggest CTA */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-8 rounded-[28px] border border-line bg-accent-soft/40 p-7 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <Eyebrow>{t.home.ctaEyebrow}</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] rtl:tracking-normal sm:text-4xl">
              {t.home.ctaHeading}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{t.home.ctaBody}</p>
          </div>
          <ButtonLink href={`/${locale}/contribute`}>{t.home.suggestCta}</ButtonLink>
        </div>
      </section>
    </main>
  )
}

function FeaturedCard({ slug }: { slug: string }) {
  const tool = TOOLS.find((candidate) => candidate.slug === slug)
  const saved = useSavedTools()
  if (!tool) return null
  return (
    <ToolCard
      tool={tool}
      saved={saved.isSaved(tool.slug)}
      onToggleSave={() => saved.toggle(tool.slug)}
    />
  )
}
