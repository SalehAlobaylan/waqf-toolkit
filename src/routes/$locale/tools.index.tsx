import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n, hreflangLinks } from '@/i18n'
import {
  TOOLS,
  CATEGORIES,
  STATUS_ORDER,
  localizedTool,
  type Tool,
  type ToolCategory,
  type ToolStatus,
} from '@/data/tools'
import { Eyebrow } from '@/components/ui'
import { ToolCard } from '@/components/tool-card'
import { useSavedTools } from '@/lib/saved-tools'
import {
  SearchIcon,
  SlidersIcon,
  StarIcon,
  FolderOpenIcon,
} from '@/components/icons'

type DirectorySearch = { q?: string; filter?: string }

function validateSearch(search: Record<string, unknown>): DirectorySearch {
  return {
    q:
      typeof search.q === 'string' && search.q.trim() !== ''
        ? search.q
        : undefined,
    filter:
      search.filter === 'saved' || search.filter === 'all' ? search.filter : undefined,
  }
}

export const Route = createFileRoute('/$locale/tools/')({
  validateSearch,
  head: ({ params }) => {
    const locale = params.locale === 'ar' ? 'ar' : 'en'
    return {
      meta: [
        {
          title:
            locale === 'ar'
              ? 'دليل الأدوات — صندوق وقف'
              : 'Toolkit directory — Waqf Toolkit',
        },
      ],
      links: hreflangLinks('/tools'),
    }
  },
  component: DirectoryPage,
})

function DirectoryPage() {
  const { q, filter } = Route.useSearch()
  // No keyed remount: the view owns query state and syncs with the URL in
  // both directions, so typing never loses focus.
  return (
    <DirectoryView
      initialQuery={q ?? ''}
      urlQuery={q}
      initialSavedOnly={filter === 'saved'}
    />
  )
}

// Searchable in both languages regardless of the active locale, so an Arabic
// query still finds a tool whose English copy matches (and vice versa).
function searchHaystack(tool: Tool): string {
  return [localizedTool(tool, 'en'), localizedTool(tool, 'ar')]
    .flatMap((text) => Object.values(text))
    .join(' ')
    .toLowerCase()
}

const haystacks = new Map(TOOLS.map((tool) => [tool.slug, searchHaystack(tool)]))

const STATUS_RANK: Record<ToolStatus, number> = {
  available: 0,
  experimental: 1,
  planned: 2,
}

function DirectoryView({
  initialQuery,
  urlQuery,
  initialSavedOnly,
}: {
  initialQuery: string
  urlQuery?: string
  initialSavedOnly: boolean
}) {
  const { locale, t } = useI18n()
  const navigate = Route.useNavigate()
  const [search, setSearch] = useState(initialQuery)
  const [category, setCategory] = useState<ToolCategory | 'all'>('all')
  const [status, setStatus] = useState<ToolStatus | 'all'>('all')
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly)
  const [sortMode, setSortMode] = useState<'ready' | 'recent'>('ready')
  const saved = useSavedTools()

  // URL -> state (back button, links from other pages), using the
  // adjust-state-during-render pattern so typing never loses focus.
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    if (urlQuery !== undefined && urlQuery !== search) {
      setSearch(urlQuery)
    }
  }

  // State -> URL on every keystroke (shareable searches). `replace` keeps
  // history clean; the local state above stays authoritative while typing.
  const onSearchChange = (value: string) => {
    setSearch(value)
    void navigate({
      search: (prev) => ({ ...prev, q: value.trim() || undefined }),
      replace: true,
    })
  }

  // Focus the search field on desktop only — mobile keyboards should stay down.
  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      searchInputRef.current?.focus({ preventScroll: true })
    }
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = new Map<ToolCategory | 'all', number>()
    for (const key of ['all', ...CATEGORIES] as const) {
      counts.set(
        key,
        key === 'all'
          ? TOOLS.length
          : TOOLS.filter((tool) => tool.category === key).length,
      )
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = TOOLS.filter((tool) => {
      if (category !== 'all' && tool.category !== category) return false
      if (status !== 'all' && tool.status !== status) return false
      if (savedOnly && !saved.savedSlugs.includes(tool.slug)) return false
      if (!term) return true
      return [
        haystacks.get(tool.slug)!,
        tool.category,
        ...tool.stack,
        ...tool.supportedFormats,
      ]
        .join(' ')
        .includes(term)
    })
    if (sortMode === 'recent') {
      return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    return [...list].sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        b.updatedAt.localeCompare(a.updatedAt),
    )
  }, [search, category, status, savedOnly, sortMode, saved.savedSlugs])

  const clearAll = () => {
    setSearch('')
    void navigate({ search: (prev) => ({ ...prev, q: undefined }), replace: true })
    setCategory('all')
    setStatus('all')
    setSavedOnly(false)
  }

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-20 pt-8 lg:px-8 lg:pt-10">
      {/* Head */}
      <div className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>
            {t.directory.directoryEyebrow.replace('{count}', String(TOOLS.length))}
          </Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] rtl:tracking-normal sm:text-4xl">
            {t.directory.heading}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-5 text-muted">
            {t.directory.subtitle}
          </p>
        </div>
        <div className="w-full max-w-md">
          <label className="glass-card flex h-11 w-full items-center gap-3 rounded-xl border border-line/70 px-4 text-muted transition-colors focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10">
            <SearchIcon className="h-4 w-4 shrink-0" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              type="search"
              placeholder={t.directory.searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
              aria-label={t.directory.searchPlaceholder}
              data-testid="input-search-tools"
            />
          </label>
          <p className="mt-2 text-end font-mono-ui text-[10px] text-muted" aria-live="polite">
            {t.directory.resultsLabel.replace('{count}', String(filtered.length))}
          </p>
        </div>
      </div>

      {/* Suggest band */}
      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[24px] border border-line/70 bg-accent-soft/40 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:p-6">
        <div>
          <Eyebrow>{t.home.ctaEyebrow}</Eyebrow>
          <p className="mt-2 max-w-xl text-sm leading-5 text-muted">{t.home.ctaBody}</p>
        </div>
        <a
          href={`/${locale}/contribute`}
          className="shrink-0 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent"
        >
          {t.home.suggestCta}
        </a>
      </div>

      {/* Filters + results */}
      <div className="flex flex-col gap-6 pt-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[190px]">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <SlidersIcon className="h-3.5 w-3.5 text-accent" />
              {t.directory.filterShelf}
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer text-xs text-muted hover:text-accent lg:mt-4"
              data-testid="button-clear-filters"
            >
              {t.directory.clearFilters}
            </button>
          </div>

          {/* Category — horizontal scroll on mobile, stacked on desktop */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-1.5 lg:overflow-visible lg:pb-0">
            <p className="eyebrow mb-2 hidden text-muted lg:block">
              {t.directory.categoryLabel}
            </p>
            {(['all', ...CATEGORIES] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={category === key}
                data-testid={`button-filter-${key.toLowerCase()}`}
                className={`flex shrink-0 cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-start text-xs transition-colors lg:w-full ${
                  category === key
                    ? 'bg-accent font-semibold text-paper'
                    : 'text-muted hover:bg-line/60 hover:text-ink'
                }`}
              >
                <span>{key === 'all' ? t.directory.allCategories : t.category[key]}</span>
                <span
                  className={`font-mono-ui text-[10px] ${
                    category === key ? 'text-paper/65' : 'text-muted/70'
                  }`}
                >
                  {categoryCounts.get(key)}
                </span>
              </button>
            ))}
          </div>

          {/* Status — desktop only list with dots */}
          <div className="mt-7 hidden lg:block">
            <p className="eyebrow mb-2 text-muted">{t.directory.statusLabel}</p>
            {(['all', ...STATUS_ORDER] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                aria-pressed={status === key}
                data-testid={`button-status-${key.toLowerCase()}`}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-start text-xs transition-colors ${
                  status === key
                    ? 'bg-line/60 font-semibold text-ink'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    key === 'available'
                      ? 'bg-accent'
                      : key === 'experimental'
                        ? 'bg-clay'
                        : key === 'planned'
                          ? 'bg-muted'
                          : 'border border-muted'
                  }`}
                />
                {key === 'all' ? t.directory.allStatuses : t.status[key]}
              </button>
            ))}
          </div>

          {/* Saved toggle */}
          <button
            type="button"
            onClick={() => setSavedOnly((value) => !value)}
            aria-pressed={savedOnly}
            data-testid="button-filter-saved"
            className={`mt-7 hidden cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors lg:flex ${
              savedOnly
                ? 'bg-accent-soft font-semibold text-accent'
                : 'text-muted hover:text-accent'
            }`}
          >
            <StarIcon className="h-3.5 w-3.5" filled={savedOnly} />
            {t.directory.savedFilter}
          </button>

          {/* Mobile fallbacks for status + saved filters */}
          <div className="mt-4 flex gap-2 lg:hidden">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ToolStatus | 'all')}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-xs"
              aria-label={t.directory.statusLabel}
              data-testid="select-status"
            >
              <option value="all">{t.directory.allStatuses}</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSavedOnly((value) => !value)}
              aria-pressed={savedOnly}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-xs ${
                savedOnly
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted'
              }`}
            >
              <StarIcon className="me-1 inline h-3.5 w-3.5" filled={savedOnly} />
              {t.site.savedNav}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Sort */}
          <div
            role="group"
            aria-label={t.directory.sortLabel}
            className="mb-3 flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => setSortMode('ready')}
              aria-pressed={sortMode === 'ready'}
              data-testid="button-sort-ready"
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors ${
                sortMode === 'ready'
                  ? 'bg-accent font-semibold text-paper'
                  : 'text-muted hover:bg-line/60 hover:text-ink'
              }`}
            >
              {t.directory.sortReadyFirst}
            </button>
            <button
              type="button"
              onClick={() => setSortMode('recent')}
              aria-pressed={sortMode === 'recent'}
              data-testid="button-sort-recent"
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors ${
                sortMode === 'recent'
                  ? 'bg-accent font-semibold text-paper'
                  : 'text-muted hover:bg-line/60 hover:text-ink'
              }`}
            >
              {t.directory.sortRecent}
            </button>
          </div>
          {filtered.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  tool={tool}
                  saved={saved.isSaved(tool.slug)}
                  onToggleSave={saved.toggle}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              query={search}
              savedOnly={savedOnly}
              onClear={clearAll}
            />
          )}
        </div>
      </div>
    </main>
  )
}

function EmptyState({
  query,
  savedOnly,
  onClear,
}: {
  query: string
  savedOnly: boolean
  onClear: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-accent-soft/20 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-line/60 text-muted">
        <FolderOpenIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.03em] rtl:tracking-normal">
        {t.directory.emptyTitle}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        {savedOnly
          ? t.directory.emptySaved
          : query
            ? t.directory.emptyQuery.replace('{query}', query)
            : t.directory.emptyGeneric}
      </p>
      <button
        type="button"
        onClick={onClear}
        data-testid="button-empty-clear"
        className="mt-5 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold transition-colors hover:border-accent/40 hover:text-accent"
      >
        {t.directory.clearFilters}
      </button>
    </div>
  )
}
