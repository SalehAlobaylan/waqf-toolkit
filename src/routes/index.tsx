import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

/**
 * Parse an Accept-Language header into our supported locales.
 */
function parsePreferredLocale(acceptLanguage: string | null): 'en' | 'ar' {
  if (!acceptLanguage) return 'en'
  const candidates = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const qualityParam = params.find((param) => param.trim().startsWith('q='))
      return {
        tag: tag.trim().toLowerCase(),
        quality: qualityParam ? parseFloat(qualityParam.split('=')[1]) || 0 : 1,
      }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const candidate of candidates) {
    const base = candidate.tag.split('-')[0]
    if (base === 'ar') return 'ar'
    if (base === 'en') return 'en'
  }
  return 'en'
}

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
