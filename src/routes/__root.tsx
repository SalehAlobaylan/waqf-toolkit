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
import { dirFor, getDictionary, isLocale, DEFAULT_LOCALE } from '@/i18n'
import { ButtonLink } from '@/components/ui'
import { SITE_URL } from '@/lib/site'
import '@/styles/app.css'

function localeFromPathname(pathname: string) {
  const segment = pathname.split('/')[1]
  return isLocale(segment) ? segment : DEFAULT_LOCALE
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#f5f2ea' },
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
      { property: 'og:image', content: `${SITE_URL}/og.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
    ],
    links: [
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
      <body className="paper-noise flex min-h-screen flex-col">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPathname(pathname)
  const t = getDictionary(locale)

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-[700px] flex-1 flex-col items-center justify-center px-5 text-center">
      <p className="font-mono-ui animate-fade text-xs font-bold uppercase tracking-[0.1em] text-clay rtl:[letter-spacing:normal]">
        {t.common.notFoundCode}
      </p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.06em] rtl:tracking-normal">
        {t.common.notFoundTitle}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">{t.common.notFoundBody}</p>
      <div className="mt-7">
        <ButtonLink href={`/${locale}`}>{t.common.goHome}</ButtonLink>
      </div>
    </main>
  )
}
