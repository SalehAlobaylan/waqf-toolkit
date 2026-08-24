import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { parsePreferredLocale } from '@/lib/negotiate-locale'

// Server-only read of the request headers; the browser never needs this
// because explicit /en and /ar URLs always win there.
const negotiateLocale = createIsomorphicFn()
  .server((): 'en' | 'ar' => {
    const request = getRequest() as Request | undefined
    return parsePreferredLocale(request?.headers.get('accept-language') ?? null)
  })
  .client((): 'en' | 'ar' => 'en')

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      href: `/${negotiateLocale()}`,
      replace: true,
    })
  },
})
