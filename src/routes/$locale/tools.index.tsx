import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { TOOLS, CATEGORIES, STATUS_ORDER, type ToolCategory, type ToolStatus } from '@/data/tools'
import { Button, Card, ButtonLink } from '@/components/ui'
import { ToolCard } from '@/components/tool-card'
import { useSavedTools } from '@/lib/saved-tools'

export const Route = createFileRoute('/$locale/tools/')({
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.locale === 'ar'
            ? 'دليل الأدوات — صندوق وقف'
            : 'Toolkit directory — Waqf Toolkit',
      },
    ],
  }),
  component: DirectoryPage,
})

function DirectoryPage() {
  const { locale, t } = useI18n()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ToolCategory | 'all'>('all')
  const [status, setStatus] = useState<ToolStatus | 'all'>('all')
  const [savedOnly, setSavedOnly] = useState(false)
  const saved = useSavedTools()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return TOOLS.filter((tool) => {
      if (category !== 'all' && tool.category !== category) return false
      if (status !== 'all' && tool.status !== status) return false
      if (savedOnly && !saved.savedSlugs.includes(tool.slug)) return false
      if (!term) return true
      return [
        tool.name,
        tool.shortDescription,
        tool.description,
        tool.category,
        ...tool.stack,
        ...tool.supportedFormats,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [search, category, status, savedOnly, saved.savedSlugs])

  const hasFilters =
    search !== '' || category !== 'all' || status !== 'all' || savedOnly

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t.directory.title}</h1>
      <p className="mt-2 max-w-xl text-muted">{t.directory.subtitle}</p>

      {/* Controls */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.directory.searchPlaceholder}
          aria-label={t.directory.searchPlaceholder}
          className="w-full max-w-xs rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent sm:w-auto"
        />
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as ToolCategory | 'all')
          }
          aria-label={t.directory.allCategories}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="all">{t.directory.allCategories}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t.category[c]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ToolStatus | 'all')
          }
          aria-label={t.directory.allStatuses}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="all">{t.directory.allStatuses}</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t.status[s]}
            </option>
          ))}
        </select>
        <Button
          variant={savedOnly ? 'primary' : 'secondary'}
          onClick={() => setSavedOnly((value) => !value)}
        >
          ★ {t.directory.showSavedOnly} ({saved.savedSlugs.length})
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              setCategory('all')
              setStatus('all')
              setSavedOnly(false)
            }}
          >
            {t.directory.clearFilters}
          </Button>
        )}
        <span className="ms-auto text-xs text-muted tabular-nums">
          {t.directory.resultsCount
            .replace('{count}', String(filtered.length))
            .replace('{total}', String(TOOLS.length))}
        </span>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        savedOnly && saved.savedSlugs.length === 0 ? (
          <Card className="mt-8 p-10 text-center">
            <h2 className="font-semibold">{t.directory.emptySavedTitle}</h2>
            <p className="mt-1 text-sm text-muted">
              {t.directory.emptySavedBody}
            </p>
          </Card>
        ) : (
          <Card className="mt-8 p-10 text-center">
            <h2 className="font-semibold">{t.directory.noResults}</h2>
            <p className="mt-1 text-sm text-muted">{t.directory.noResultsHint}</p>
          </Card>
        )
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl border border-dashed border-line p-6 text-center">
        <p className="text-sm text-muted">{t.home.suggestBody}</p>
        <ButtonLink href={`/${locale}/contribute`} variant="secondary" className="mt-3">
          {t.home.suggestCta}
        </ButtonLink>
      </div>
    </div>
  )
}
