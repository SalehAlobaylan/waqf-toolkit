import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { dirFor, isLocale, DEFAULT_LOCALE } from '@/i18n'
import { ButtonLink } from '@/components/ui'

function localeFromPathname(pathname: string) {
  const segment = pathname.split('/')[1]
  return isLocale(segment) ? segment : DEFAULT_LOCALE
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#faf9f6' },
      { title: 'Waqf Toolkit' },
      {
        name: 'description',
        content:
          'Waqf Toolkit — a collection of free, open-source digital tools. Local-first, privacy-respecting, honestly labelled.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Waqf Toolkit' },
      { property: 'og:title', content: 'Waqf Toolkit' },
      {
        property: 'og:description',
        content:
          'Free, open-source digital tools. Local-first, privacy-respecting, honestly labelled.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap',
      },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  )

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPathname(pathname)

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPathname(pathname)
  const en = locale === 'en'

  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {en ? 'Page not found' : 'الصفحة غير موجودة'}
      </h1>
      <p className="max-w-md text-muted">
        {en
          ? 'The page may have moved, or the link may be incomplete. The toolkit directory is a good place to restart.'
          : 'ربما انتقلت الصفحة أو كان الرابط ناقصاً. دليل الأدوات نقطة بداية جيدة.'}
      </p>
      <ButtonLink href={`/${locale}`}>{en ? 'Go home' : 'الذهاب للرئيسية'}</ButtonLink>
    </main>
  )
}
