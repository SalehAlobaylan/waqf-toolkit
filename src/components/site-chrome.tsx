import { Link } from '@tanstack/react-router'
import { useI18n, lhref } from '@/i18n'
import { GithubIcon } from './github-icon'

export const GITHUB_REPO_URL = 'https://github.com/SalehAlobaylan/waqf-toolkit'

export function SiteHeader() {
  const { locale, t } = useI18n()

  const navItems = [
    { href: lhref('/tools', locale), label: t.site.navTools },
    { href: lhref('/contribute', locale), label: t.site.navContribute },
  ]

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          to={lhref('/', locale)}
          className="text-sm font-semibold tracking-tight hover:text-accent"
        >
          {t.site.name}
        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-line/50 hover:text-ink"
              activeOptions={{ exact: false }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={t.site.navGithub}
            className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-line/50 hover:text-ink"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <Link
            to={lhref('/', locale === 'en' ? 'ar' : 'en')}
            className="rounded-md px-3 py-1.5 font-medium transition-colors hover:bg-line/50"
            aria-label={t.site.languageSwitchLabel}
          >
            {t.site.languageSwitch}
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted space-y-2">
        <p>{t.site.footerNote}</p>
        <p>
          {t.site.footerLicense}{' '}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  )
}
