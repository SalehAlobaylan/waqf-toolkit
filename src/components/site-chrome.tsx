import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { useI18n } from '@/i18n'
import { REPO_URL } from '@/lib/github'
import { switchLocalePath } from '@/lib/locale-path'
import { useSavedTools } from '@/lib/saved-tools'
import { GithubIcon } from './github-icon'
import { GlobeIcon, MenuIcon, CloseIcon, StarIcon } from './icons'

export const GITHUB_REPO_URL = REPO_URL

export function LogoMark() {
  const { locale, t } = useI18n()
  return (
    <Link to="/$locale" params={{ locale }} className="group flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-forest text-olive transition-transform duration-300 group-hover:-rotate-6">
        <span className="font-display text-xl font-bold">{t.site.logoLetter}</span>
      </span>
      <span className="font-display text-lg font-semibold tracking-[-0.03em]">
        {t.site.wordmark}{' '}
        <span className="font-sans font-normal text-muted">/ {t.site.wordmarkSuffix}</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const { locale, t } = useI18n()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const otherLocale = locale === 'en' ? 'ar' : 'en'
  const saved = useSavedTools()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { to: '/$locale/tools', label: t.site.navTools },
    { to: '/$locale/contribute', label: t.site.navContribute },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-30 focus:rounded-md focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm focus:shadow-card"
      >
        {t.common.skipToContent}
      </a>
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <LogoMark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={{ locale }}
              className="rounded-full px-4 py-2 text-sm transition-colors"
              activeOptions={{ exact: false }}
              activeProps={{ className: 'bg-accent-soft font-semibold text-accent!' }}
              inactiveProps={{ className: 'text-muted hover:bg-line/60 hover:text-ink' }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/$locale/tools"
            params={{ locale }}
            search={{ filter: 'saved' }}
            data-testid="link-saved"
            className="ms-3 flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            <StarIcon className="h-3.5 w-3.5" />
            {t.site.savedNav}
            {saved.savedSlugs.length > 0 && (
              <span className="font-mono-ui text-[10px] text-clay">
                {saved.savedSlugs.length}
              </span>
            )}
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={t.site.navGithub}
            className="ms-1 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-ink"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() =>
              navigate({ href: switchLocalePath(pathname, otherLocale) })
            }
            className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-line/60 hover:text-ink"
            aria-label={t.site.languageSwitchLabel}
          >
            <GlobeIcon className="h-3.5 w-3.5" />
            {t.site.languageSwitch}
          </button>
        </nav>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="cursor-pointer rounded-lg p-2 text-muted hover:bg-line/60 md:hidden"
          aria-label={t.common.toggleNav}
          aria-expanded={menuOpen}
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-line/70 px-5 py-3 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={{ locale }}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-line/60 py-3 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            className="block border-b border-line/60 py-3 text-sm font-medium"
          >
            {t.site.navGithub}
          </a>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              navigate({ href: switchLocalePath(pathname, otherLocale) })
            }}
            className="block cursor-pointer py-3 text-sm font-medium"
          >
            {t.site.languageSwitchLabel}
          </button>
        </div>
      )}
    </header>
  )
}

export function SiteFooter() {
  const { locale, t } = useI18n()

  return (
    <footer className="border-t border-line/80 bg-accent-soft/35">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-forest text-olive">
              <span className="font-display text-xl font-bold">{t.site.logoLetter}</span>
            </span>
            <span className="font-display text-lg font-semibold tracking-[-0.03em]">
              {t.site.wordmark}
            </span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-muted">{t.site.tagline}</p>
        </div>

        <nav aria-label={t.site.footerExploreTitle}>
          <p className="eyebrow text-muted">{t.site.footerExploreTitle}</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link
              to="/$locale/tools"
              params={{ locale }}
              className="transition-colors hover:text-accent"
            >
              {t.directory.title}
            </Link>
            <Link
              to="/$locale/contribute"
              params={{ locale }}
              className="transition-colors hover:text-accent"
            >
              {t.contribute.title}
            </Link>
          </div>
        </nav>

        <div>
          <p className="eyebrow text-muted">{t.home.principlesTitle}</p>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <span>{t.home.principle1Title}</span>
            <span>{t.home.principle3Title}</span>
            <span>{t.home.principle4Title}</span>
          </div>
        </div>

        <div>
          <p className="eyebrow text-muted">{t.site.footerLanguagesTitle}</p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <GlobeIcon className="h-4 w-4 text-accent" />
            <span>English</span>
            <span className="text-muted">/</span>
            <span>العربية</span>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-2 border-t border-line/60 px-5 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span>{t.site.footerNoteShort}</span>
        <span className="font-mono-ui" dir="ltr">
          made for useful work / 2026
        </span>
      </div>
    </footer>
  )
}
