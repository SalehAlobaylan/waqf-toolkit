import type { ComponentType } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useI18n, hreflangLinks, type Locale } from '@/i18n'
import { getTool, localizedTool, relatedTools, type Tool } from '@/data/tools'
import { TOOL_COMPONENTS } from '@/tools/registry'
import { TOOL_LAYOUTS } from '@/lib/panes'
import { ButtonLink } from '@/components/ui'
import { CategoryTile, StatusPill, SaveButton } from '@/components/tool-card'
import { GITHUB_REPO_URL } from '@/components/site-chrome'
import { StatusStrip, ToolAbout, ToolRelated } from '@/components/tool-app'
import { useSavedTools } from '@/lib/saved-tools'
import { ArrowRightIcon } from '@/components/icons'
import { GithubIcon } from '@/components/github-icon'

/**
 * Card Studio share links carry the whole document in `?b=`. Read it through
 * the router rather than `window.location.search` so it survives client-side
 * navigation and stays typed. The key is omitted rather than set to
 * `undefined` when absent, which keeps `search` optional on every `<Link>`
 * into this route instead of forcing all of them to pass it.
 */
export const Route = createFileRoute('/$locale/tools/$slug')({
  validateSearch: (search: Record<string, unknown>): { b?: string } =>
    typeof search.b === 'string' ? { b: search.b } : {},
  beforeLoad: ({ params }) => {
    if (!getTool(params.slug)) {
      throw notFound()
    }
  },
  head: ({ params }) => {
    const tool = getTool(params.slug)
    const locale: Locale = params.locale === 'ar' ? 'ar' : 'en'
    const text = tool ? localizedTool(tool, locale) : undefined
    return {
      meta: [
        {
          title: text
            ? locale === 'ar'
              ? `${text.name} — صندوق وقف`
              : `${text.name} — Waqf Toolkit`
            : 'Waqf Toolkit',
        },
        ...(text
          ? [{ name: 'description', content: text.shortDescription }]
          : []),
      ],
      links: hreflangLinks(`/tools/${params.slug}`),
    }
  },
  component: ToolDetailPage,
})

function ToolDetailPage() {
  const { slug } = Route.useParams()
  const tool = getTool(slug)!
  const layout = TOOL_LAYOUTS[slug]
  const Component = TOOL_COMPONENTS[slug]
  const related = relatedTools(tool)

  if (Component && layout?.template === 'app') {
    return <AppTemplate Component={Component} tool={tool} related={related} />
  }
  return <DocumentTemplate tool={tool} related={related} />
}

/**
 * App template — the tool IS the page.
 *
 * There is no identity block above the workspace: no icon tile, no 32px
 * heading, no "open the tool" button pointing at the page you are already on,
 * no panel title bar. Together those cost ~326px of vertical dead zone before
 * a single line of tool UI, plus ~580px of horizontal margin at 1440px. The
 * contextual header carries identity, the status strip carries the required
 * processing disclosure, and the About disclosure below the fold carries the
 * long-form record.
 */
function AppTemplate({
  Component,
  tool,
  related,
}: {
  Component: ComponentType
  tool: Tool
  related: Tool[]
}) {
  // The tool renders its own Workspace and action bar: the bar's handlers
  // (undo, save, open) live inside the tool, so the shell cannot own it.
  return (
    <>
      <Component />
      <StatusStrip tool={tool} />
      <div className="mx-auto w-full max-w-[var(--shell-w)] space-y-6 px-4 py-8 sm:px-5 lg:px-6">
        <ToolAbout tool={tool} />
        <ToolRelated tools={related} />
      </div>
    </>
  )
}

/**
 * Document template for informational entries — a tightened prose record. No
 * back link above the title (the header already carries navigation), no fake
 * panel, metadata as a definition list.
 */
function DocumentTemplate({
  tool,
  related,
}: {
  tool: Tool
  related: Tool[]
}) {
  const { locale, t } = useI18n()
  const saved = useSavedTools()
  const text = localizedTool(tool, locale)

  return (
    <main className="mx-auto w-full max-w-[var(--measure)] px-5 pb-16 pt-8 lg:px-6">
      <div className="flex items-start gap-4">
        <CategoryTile category={tool.category} large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-muted">{t.category[tool.category]}</span>
            <StatusPill status={tool.status} />
          </div>
          <h1 className="mt-2 font-display text-[28px] font-semibold leading-none tracking-[-0.03em] rtl:tracking-normal sm:text-[34px]">
            {text.name}
          </h1>
        </div>
      </div>

      <p className="mt-4 max-w-[62ch] text-sm leading-6 text-muted">
        {text.shortDescription}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {tool.trackingIssue && (
          <ButtonLink
            href={`${GITHUB_REPO_URL}/issues/${tool.trackingIssue}`}
            external
            variant="muted"
            className="gap-2 px-4 py-2.5 text-xs"
          >
            {t.tool.viewPlan}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </ButtonLink>
        )}
        <SaveButton
          saved={saved.isSaved(tool.slug)}
          onToggle={() => saved.toggle(tool.slug)}
          slug={tool.slug}
        />
        {tool.repoUrl && (
          <ButtonLink
            href={tool.repoUrl}
            external
            variant="outline"
            data-testid={`link-repo-${tool.slug}`}
            className="gap-2 px-4 py-2.5 text-xs"
          >
            <GithubIcon className="h-4 w-4" />
            {t.contribute.viewOnGithub}
          </ButtonLink>
        )}
      </div>

      <div className="mt-7">
        <ToolAbout tool={tool} />
      </div>

      <div className="mt-8 border-t border-line pt-7">
        <ToolRelated tools={related} />
      </div>
    </main>
  )
}
