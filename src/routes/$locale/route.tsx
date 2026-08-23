import { createFileRoute, Outlet } from '@tanstack/react-router'
import { isLocale, I18nProvider } from '@/i18n'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) {
      throw new Error('Unknown locale')
    }
    return { locale: params.locale }
  },
  component: LocaleLayout,
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
