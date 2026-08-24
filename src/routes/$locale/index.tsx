import { createFileRoute, Link } from '@tanstack/react-router'
import { useI18n, hreflangLinks } from '@/i18n'
import { TOOLS } from '@/data/tools'
import { ButtonLink, Eyebrow, InfoCard } from '@/components/ui'
import { ToolCard } from '@/components/tool-card'
import { useSavedTools } from '@/lib/saved-tools'
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CircleCheckIcon,
  CodeIcon,
  FileTextIcon,
  SparklesIcon,
} from '@/components/icons'

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
  const featured = TOOLS.filter((tool) => tool.featured)

  return (
    <main>
      {/* Hero */}
      <section className="shell-grid relative overflow-hidden border-b border-line/70">
        <div className="mx-auto grid max-w-[1240px] items-end gap-12 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1fr_390px] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="animate-rise">
            <div className="mb-7 flex items-center gap-3 text-xs text-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                <SparklesIcon className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono-ui font-bold uppercase tracking-[0.12em] rtl:[letter-spacing:normal]">
                {t.home.heroKicker}
              </span>
            </div>
            <h1 className="max-w-[14ch] font-display text-[clamp(3.5rem,9vw,7.7rem)] font-semibold leading-[0.88] tracking-[-0.075em] rtl:max-w-none rtl:leading-[1.05] rtl:tracking-normal">
              {t.home.heroLine1}
              <br />
              <span className="text-accent">{t.home.heroLine2}</span>
            </h1>
            <p className="mt-8 max-w-[530px] text-base leading-7 text-muted sm:text-lg">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={`/${locale}/tools`}
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

          {/* How it works card */}
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
                  <span className="eyebrow text-olive">{t.home.howItWorksTitle}</span>
                  <FileTextIcon className="h-4 w-4 text-paper/45" />
                </div>
                <ol className="mt-7 space-y-6">
                  {[
                    { n: '01', title: t.home.step1Title, body: t.home.step1Body },
                    { n: '02', title: t.home.step2Title, body: t.home.step2Body },
                    { n: '03', title: t.home.step3Title, body: t.home.step3Body },
                  ].map((step) => (
                    <li key={step.n} className="flex gap-4">
                      <span className="font-mono-ui text-xs text-olive">{step.n}</span>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-paper/60">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
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
        <div className="mt-9 grid gap-4 lg:grid-cols-3">
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
