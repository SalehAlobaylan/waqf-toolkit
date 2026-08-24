import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { en, type Dictionary } from './en'
import { ar } from './ar'
import { SITE_URL } from '@/lib/site'

export const LOCALES = ['en', 'ar'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

const dictionaries: Record<Locale, Dictionary> = { en, ar }

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function dirFor(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

type I18nValue = {
  locale: Locale
  dir: 'ltr' | 'rtl'
  t: Dictionary
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, dir: dirFor(locale), t: dictionaries[locale] }),
    [locale],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside a $locale route')
  return value
}

/** Direct dictionary access for components rendered outside I18nProvider (e.g. notFoundComponent). */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

/** Locale-aware href helper: href('/tools', locale) -> '/en/tools' */
export function lhref(path: string, locale: Locale): string {
  return `/${locale}${path === '/' ? '' : path}`
}

/**
 * hreflang <link> set for a localized page so search engines pair /en and /ar.
 */
export function hreflangLinks(
  path: string,
): Array<{ rel: string; hrefLang: string; href: string }> {
  const suffix = path === '/' ? '' : path
  return [
    { rel: 'alternate', hrefLang: 'en', href: `${SITE_URL}/en${suffix}` },
    { rel: 'alternate', hrefLang: 'ar', href: `${SITE_URL}/ar${suffix}` },
    // English is the default language variant.
    { rel: 'alternate', hrefLang: 'x-default', href: `${SITE_URL}/en${suffix}` },
  ]
}
