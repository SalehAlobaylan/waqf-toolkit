import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { REPO_URL } from '@/lib/github'
import { switchLocalePath } from '@/lib/locale-path'
import { getTool, localizedTool, STATUS_ORDER, TOOLS } from '@/data/tools'
import { isAppSurface, toolPathFor } from '@/lib/surface'
import { useSavedTools } from '@/lib/saved-tools'
import { SaveButton } from './tool-card'
import { GithubIcon } from './github-icon'
import { MarkKnockout, MarkTile } from './logo'
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

export function LogoMark({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n()
  return (
    <Link
      to="/$locale"
      params={{ locale }}
      className="group flex shrink-0 items-center gap-3"
    >
      <MarkTile
        className={`shrink-0 transition-transform duration-300 group-hover:-rotate-6 ${
          compact ? 'h-7 w-7' : 'h-9 w-9'
        }`}
        aria-hidden="true"
      />
      {compact ? null : (
        <span className="font-display text-lg font-semibold tracking-[-0.03em]">
          {t.site.wordmark}{' '}
          <span className="font-sans font-normal text-muted">/ {t.site.wordmarkSuffix}</span>
        </span>
      )}
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

/**
 * Site header.
 *
 * `app` swaps the marketing nav for a contextual one: on a tool page the
 * header carries the tool's identity and status, and the chrome shrinks from
 * 72px to 56px so the workspace gets the height back. The logo, the tools
 * dropdown, the locale switch and the menu all stay — nothing becomes
 * unreachable — but the "Contribute" link drops out of a header you are
 * already inside a tool.
 */
export function SiteHeader() {
  const { locale, t } = useI18n()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const otherLocale = locale === 'en' ? 'ar' : 'en'
  const saved = useSavedTools()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const app = isAppSurface(pathname)
  const toolPath = toolPathFor(pathname)
  const tool = toolPath ? getTool(toolPath.slug) : undefined
  const toolText = tool ? localizedTool(tool, locale) : undefined

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // On the locale home the header starts transparent over the dawn hero
  // panel and gains its paper surface as soon as the page scrolls.
  const transparent = !app && pathname === `/${locale}` && !scrolled
  const height = app ? 'h-[var(--header-h-app)]' : 'h-[var(--header-h)]'

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
      <div
        className={`mx-auto flex ${height} max-w-[var(--shell-w)] items-center justify-between gap-3 px-4 sm:px-5 lg:px-6`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark compact={app} />
          {app && tool && toolText && (
            <span className="flex min-w-0 items-center gap-2 border-s border-line/70 ps-3">
              <StatusDot status={tool.status} />
              {/* On the app template the header IS the page heading: there is
                  deliberately no large h1 above the workspace. */}
              <h1 className="truncate text-sm font-semibold text-ink">
                {toolText.name}
              </h1>
              <SaveButton
                saved={saved.isSaved(tool.slug)}
                onToggle={() => saved.toggle(tool.slug)}
                slug={tool.slug}
                compact
              />
            </span>
          )}
        </div>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <ToolsMenu />
          {!app && (
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
          )}
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

  // The footer is the one solid brand surface on the site, so it runs on the
  // logo's own green and carries the knockout mark. Everything inside it is
  // stepped down from cream so the block never fights the page above it.
  return (
    <footer className="relative z-10 bg-brand-forest text-brand-cream">
      <div className="mx-auto grid max-w-[var(--shell-w)] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <MarkKnockout className="h-10 w-10 shrink-0" aria-hidden="true" />
            <span className="font-display text-lg font-semibold tracking-[-0.03em]">
              {t.site.wordmark}
            </span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-brand-cream/70">
            {t.site.tagline}
          </p>
        </div>

        <nav aria-label={t.site.footerExploreTitle}>
          <p className="eyebrow text-brand-olive">{t.site.footerExploreTitle}</p>
          <div className="mt-4 grid gap-3 text-sm text-brand-cream/85">
            <Link
              to="/$locale/tools"
              params={{ locale }}
              className="transition-colors hover:text-brand-olive"
            >
              {t.directory.title}
            </Link>
            <Link
              to="/$locale/contribute"
              params={{ locale }}
              className="transition-colors hover:text-brand-olive"
            >
              {t.contribute.title}
            </Link>
          </div>
        </nav>

        <div>
          <p className="eyebrow text-brand-olive">{t.home.principlesTitle}</p>
          <div className="mt-4 grid gap-3 text-sm text-brand-cream/70">
            <span>{t.home.principle1Title}</span>
            <span>{t.home.principle3Title}</span>
            <span>{t.home.principle4Title}</span>
          </div>
        </div>

        <div>
          <p className="eyebrow text-brand-olive">{t.site.footerLanguagesTitle}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-cream/85">
            <GlobeIcon className="h-4 w-4 text-brand-olive" />
            <span>English</span>
            <span className="text-brand-cream/50">/</span>
            <span>العربية</span>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[var(--shell-w)] flex-col gap-2 border-t border-brand-cream/12 px-5 py-5 text-xs text-brand-cream/55 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span>{t.site.footerNoteShort}</span>
        <span className="font-mono-ui" dir="ltr">
          made for useful work / 2026
        </span>
      </div>
    </footer>
  )
}
