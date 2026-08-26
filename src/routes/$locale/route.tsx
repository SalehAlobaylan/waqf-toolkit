import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { isLocale, getDictionary, I18nProvider } from '@/i18n'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { ButtonLink } from '@/components/ui'

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) {
      throw notFound()
    }
    return { locale: params.locale }
  },
  component: LocaleLayout,
  notFoundComponent: LocaleNotFound,
})

function LocaleLayout() {
  const { locale } = Route.useParams()
  return (
    <I18nProvider locale={locale as 'en' | 'ar'}>
      {/* Liquid-glass backdrop stage: ambient washes plus slow-drifting
          blurred color blobs. Everything frosted refracts this layer. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="bg-ambient absolute inset-0" />
        <div className="animate-blob absolute -top-48 start-[-10%] h-[36rem] w-[36rem] rounded-full bg-olive/30 blur-[110px]" />
        <div className="animate-blob absolute end-[-12%] top-1/3 h-[30rem] w-[30rem] rounded-full bg-clay/22 blur-[110px] [animation-delay:-9s]" />
        <div className="animate-blob absolute bottom-[-14rem] start-1/3 h-[32rem] w-[32rem] rounded-full bg-accent/15 blur-[120px] [animation-delay:-17s]" />
      </div>
      <SiteHeader />
      <main id="main" className="relative z-10 flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </I18nProvider>
  )
}

function LocaleNotFound() {
  const { locale: localeParam } = Route.useParams()
  const locale = isLocale(localeParam) ? localeParam : 'en'
  const t = getDictionary(locale)
  return (
    <I18nProvider locale={locale}>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <div className="mx-auto flex min-h-[65vh] w-full max-w-[700px] flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="font-mono-ui animate-fade text-xs font-bold uppercase tracking-[0.1em] text-clay rtl:[letter-spacing:normal]">
            {t.common.notFoundCode}
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.06em] rtl:tracking-normal">
            {t.common.notFoundTitle}
          </h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted">{t.common.notFoundBody}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`/${locale}`}>{t.common.goHome}</ButtonLink>
            <a
              href={`/${locale}/tools`}
              className="inline-flex items-center rounded-full border border-line bg-surface px-5 py-3.5 text-sm font-medium transition-colors hover:border-accent/40 hover:text-accent"
            >
              {t.directory.title}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </I18nProvider>
  )
}
