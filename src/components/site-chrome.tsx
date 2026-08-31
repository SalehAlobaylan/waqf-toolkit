import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { REPO_URL } from '@/lib/github'
import { switchLocalePath } from '@/lib/locale-path'
import { localizedTool, STATUS_ORDER, TOOLS } from '@/data/tools'
import { useSavedTools } from '@/lib/saved-tools'
import { GithubIcon } from './github-icon'
import { GlobeIcon, MenuIcon, CloseIcon, StarIcon, ChevronDownIcon } from './icons'

export const GITHUB_REPO_URL = REPO_URL

/** Tools ordered usable-first for menus: available → experimental → planned, then recent. */
const MENU_TOOLS = [...TOOLS].sort((a, b) => {
  const rank = (status: string) => STATUS_ORDER.indexOf(status as never)
  return rank(a.status) - rank(b.status) || b.updatedAt.localeCompare(a.updatedAt)
})

export function StatusDot({ status }: { status: 'available' | 'experimental' | 'planned' | 'archived' }) {
  const dots: Record<string, string> = {
    available: 'bg-accent',
    experimental: 'bg-clay',
    planned: 'bg-muted',
    archived: 'bg-muted/60',
  }
  return (
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${dots[status]}`}
    />
  )
}

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

/** Tools ▾ dropdown: every tool one click away from any page. */
function ToolsMenu() {
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="button-tools-menu"
        className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors ${
          open
            ? 'bg-accent-soft font-semibold text-accent'
            : 'text-muted hover:bg-line/60 hover:text-ink'
        }`}
      >
        {t.site.navTools}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t.site.navTools}
          className="glass-panel absolute end-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line/70 p-2"
        >
          {MENU_TOOLS.map((tool) => {
            const text = localizedTool(tool, locale)
            return (
              <Link
                key={tool.slug}
                to="/$locale/tools/$slug"
                params={{ locale, slug: tool.slug }}
                role="menuitem"
                onClick={() => setOpen(false)}
                data-testid={`menu-tool-${tool.slug}`}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-line/60 hover:text-ink"
              >
                <StatusDot status={tool.status} />
                <span className="truncate font-medium">{text.name}</span>
              </Link>
            )
          })}
          <Link
            to="/$locale/tools"
            params={{ locale }}
            onClick={() => setOpen(false)}
            className="mt-1 block border-t border-line/70 px-3 pb-1 pt-3 text-xs font-semibold text-accent"
          >
            {t.home.seeAllCount.replace('{count}', String(TOOLS.length))}
          </Link>
        </div>
      )}
    </div>
  )
}

export function SiteHeader() {
  const { locale, t } = useI18n()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const otherLocale = locale === 'en' ? 'ar' : 'en'
  const saved = useSavedTools()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // On the locale home the header starts transparent over the dawn hero
  // panel and gains its paper surface as soon as the page scrolls.
  const transparent = pathname === `/${locale}` && !scrolled

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        transparent
          ? 'border-transparent bg-transparent'
          : 'border-line/80 bg-paper/90 backdrop-blur-xl'
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-30 focus:rounded-md focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm focus:shadow-card"
      >
        {t.common.skipToContent}
      </a>
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <LogoMark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <ToolsMenu />
          <Link
            to="/$locale/contribute"
            params={{ locale }}
            className="rounded-full px-4 py-2 text-sm transition-colors"
            activeOptions={{ exact: false }}
            activeProps={{ className: 'bg-accent-soft font-semibold text-accent!' }}
            inactiveProps={{ className: 'text-muted hover:bg-line/60 hover:text-ink' }}
          >
            {t.site.navContribute}
          </Link>
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
        <div className="border-t border-line/70 bg-paper/85 px-5 py-3 backdrop-blur-xl md:hidden">
          <Link
            to="/$locale/tools"
            params={{ locale }}
            onClick={() => setMenuOpen(false)}
            className="block border-b border-line/60 py-3 text-sm font-medium"
          >
            {t.site.navTools}
          </Link>
          {MENU_TOOLS.map((tool) => {
            const text = localizedTool(tool, locale)
            return (
              <Link
                key={tool.slug}
                to="/$locale/tools/$slug"
                params={{ locale, slug: tool.slug }}
                onClick={() => setMenuOpen(false)}
                data-testid={`mobile-menu-tool-${tool.slug}`}
                className="flex items-center gap-2.5 border-b border-line/60 py-2.5 text-sm text-muted"
              >
                <StatusDot status={tool.status} />
                {text.name}
              </Link>
            )
          })}
          <Link
            to="/$locale/contribute"
            params={{ locale }}
            onClick={() => setMenuOpen(false)}
            className="block border-b border-line/60 py-3 text-sm font-medium"
          >
            {t.site.navContribute}
          </Link>
          <Link
            to="/$locale/tools"
            params={{ locale }}
            search={{ filter: 'saved' }}
            onClick={() => setMenuOpen(false)}
            data-testid="link-saved-mobile"
            className="flex items-center gap-2 border-b border-line/60 py-3 text-sm font-medium"
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
    <footer className="relative z-10 border-t border-line/80 bg-accent-soft/35">
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
