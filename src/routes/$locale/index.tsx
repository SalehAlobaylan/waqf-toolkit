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
      {/* Hero — dawn panel with floating category tiles */}
      <section className="mx-auto max-w-[1240px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8">
        <div className="bg-dawn relative overflow-hidden rounded-[32px] border border-line/70 px-5 pb-14 pt-14 sm:pb-16 sm:pt-16 lg:pt-20">
          <div
            aria-hidden="true"
            className="absolute -start-14 -top-14 h-52 w-52 rounded-full border-[26px] border-olive/30"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -end-10 h-56 w-56 rounded-full border border-olive/50"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden select-none lg:block"
          >
            <div className="absolute start-[6%] top-[24%] -rotate-6 animate-drift drop-shadow-[0_14px_28px_hsl(160_25%_20%/0.14)]">
              <CategoryTile category="Media" large />
            </div>
            <div className="absolute bottom-[14%] start-[13%] rotate-6 animate-drift drop-shadow-[0_14px_28px_hsl(160_25%_20%/0.14)] [animation-delay:-2s]">
              <CategoryTile category="Privacy" large />
            </div>
            <div className="absolute end-[6%] top-[18%] rotate-6 animate-drift drop-shadow-[0_14px_28px_hsl(160_25%_20%/0.14)] [animation-delay:-4s]">
              <CategoryTile category="Documents" large />
            </div>
            <div className="absolute bottom-[18%] end-[13%] -rotate-6 animate-drift drop-shadow-[0_14px_28px_hsl(160_25%_20%/0.14)] [animation-delay:-6s]">
              <CategoryTile category="Everyday" large />
            </div>
            <div className="absolute start-[26%] top-[13%] rotate-3 animate-drift [animation-delay:-3s]">
              <CategoryTile category="Everyday" />
            </div>
            <div className="absolute end-[26%] top-[11%] -rotate-3 animate-drift [animation-delay:-5s]">
              <CategoryTile category="Media" />
            </div>
          </div>

          <div className="relative mx-auto flex max-w-[760px] flex-col items-center text-center">
            <h1
              className="animate-rise font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.04em] rtl:leading-[1.2] rtl:tracking-normal"
              style={{ animationDelay: '60ms' }}
            >
              {t.home.heroLine1}
              <br />
              <span className="text-clay-deep">{t.home.heroLine2}</span>
            </h1>
            <p
              className="animate-rise mt-5 max-w-[520px] text-sm leading-6 text-muted sm:text-base"
              style={{ animationDelay: '120ms' }}
            >
              {t.home.heroSubtitle}
            </p>
            <form
              className="animate-rise mt-7 flex w-full max-w-[560px] items-center gap-3 rounded-full border border-line bg-surface px-5 py-3.5 shadow-float transition-colors focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10"
              style={{ animationDelay: '180ms' }}
              onSubmit={(event) => {
                event.preventDefault()
                const q = heroQuery.trim()
                if (!q) return
                navigate({ to: '/$locale/tools', params: { locale }, search: { q } })
              }}
            >
              <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
              <input
                value={heroQuery}
                onChange={(event) => setHeroQuery(event.target.value)}
                type="search"
                placeholder={t.directory.searchPlaceholder}
                aria-label={t.directory.searchPlaceholder}
                data-testid="input-hero-search"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted/70"
              />
            </form>

            {/* Most-used glass card floating over the gradient */}
            <div
              className="animate-rise mt-9 w-full max-w-[460px]"
              style={{ animationDelay: '300ms' }}
            >
              <div className="overflow-hidden rounded-[22px] border border-line/80 bg-paper/60 shadow-float backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
                  <span className="eyebrow text-accent">{t.home.mostUsed}</span>
                  <SparklesIcon className="h-4 w-4 text-clay" />
                </div>
                <ul className="p-2">
                  {USABLE_TOOLS.map((tool) => {
                    const toolText = localizedTool(tool, locale)
                    return (
                      <li key={tool.slug}>
                        <Link
                          to="/$locale/tools/$slug"
                          params={{ locale, slug: tool.slug }}
                          data-testid={`hero-tool-${tool.slug}`}
                          className="group -mx-1 flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent-soft/50"
                        >
                          <CategoryTile category={tool.category} />
                          <span className="min-w-0 flex-1 text-start">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold">
                                {toolText.name}
                              </span>
                              <StatusDot status={tool.status} />
                            </span>
                            <span className="mt-0.5 block truncate text-xs leading-5 text-muted">
                              {toolText.shortDescription}
                            </span>
                          </span>
                          <ArrowRightIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                <Link
                  to="/$locale/tools"
                  params={{ locale }}
                  data-testid="link-hero-all-tools"
                  className="group flex items-center justify-between border-t border-line/70 px-5 py-3.5 text-xs font-semibold text-accent transition-colors hover:text-accent-strong"
                >
                  {t.home.seeAllCount.replace('{count}', String(TOOLS.length))}
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                </Link>
              </div>
            </div>
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
