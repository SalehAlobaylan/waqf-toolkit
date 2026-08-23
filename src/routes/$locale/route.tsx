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
      <SiteHeader />
      <main id="main" className="flex-1">
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
        <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          <p className="text-sm font-medium text-accent">404</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.common.notFoundTitle}
          </h1>
          <p className="max-w-md text-muted">{t.common.notFoundBody}</p>
          <ButtonLink href={`/${locale}/tools`} variant="secondary">
            {t.directory.title}
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </I18nProvider>
  )
}
