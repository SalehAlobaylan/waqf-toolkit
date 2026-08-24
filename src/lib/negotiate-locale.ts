/**
 * Parse an Accept-Language header into our supported locales.
 */
export function parsePreferredLocale(
  acceptLanguage: string | null,
): 'en' | 'ar' {
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
