import type { ReactNode } from 'react'
import { useI18n } from '@/i18n'
import type { Tool } from '@/data/tools'
import { localizedTool } from '@/data/tools'
import { methodologyUrl } from '@/lib/surface'
import { useSavedTools } from '@/lib/saved-tools'
import { ToolCard } from '@/components/tool-card'
import { GithubIcon } from '@/components/github-icon'
import { InfoIcon, ShieldCheckIcon } from '@/components/icons'
import { ButtonLink, Eyebrow } from '@/components/ui'

/**
 * The app template: the tool IS the page.
 *
 * There is no identity block above the workspace — no icon tile, no 32px
 * heading, no "open the tool" button pointing at the page you are already on,
 * no panel title bar. Together those cost about 326px of vertical dead zone
 * before a single line of tool UI, plus roughly 580px of horizontal margin at
 * 1440px. The header carries identity, the status strip carries the required
 * processing disclosure, and the About disclosure below the fold carries the
 * long-form record.
 */

/**
 * Persistent processing disclosure. AGENTS.md requires every tool page to
 * state where processing happens, so this never collapses; the long-form
 * detail lives in `ToolAbout`.
 */
export function StatusStrip({ tool }: { tool: Tool }) {
  const { locale, t } = useI18n()
  const text = localizedTool(tool, locale)
  const methodology = methodologyUrl(tool.slug)
  return (
    <div className="tool-strip flex min-h-[var(--strip-h)] flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/70 bg-accent-soft/25 px-4 py-2 text-[11px] leading-4 sm:px-5">
      <span className="flex min-w-0 items-center gap-1.5">
        <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="font-semibold text-ink">
          {t.tool.processingNote}:
        </span>
        <span className="min-w-0 text-muted">{text.processingNote}</span>
      </span>
      {methodology && (
        <a
          href={methodology}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
        >
          {t.tool.methodology}
        </a>
      )}
    </div>
  )
}

/** Named-provider disclosure, per the AGENTS.md cloud-integration rule. */
function ProcessingNote({ tool }: { tool: Tool }) {
  const { t } = useI18n()
  const tone =
    tool.processing === 'browser'
      ? t.tool.processingBrowser
      : tool.processing === 'server'
        ? t.tool.processingServer
        : t.tool.processingCloudApi
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink">
      <ShieldCheckIcon className="h-3.5 w-3.5 text-accent" />
      {tone}
      {tool.providers && tool.providers.length > 0 && (
        <span className="font-normal text-muted">
          — {t.tool.dataSources}: {tool.providers.join(', ')}
        </span>
      )}
    </p>
  )
}

/** Long-form record. Collapsed by default, but present in the DOM for crawlers. */
export function ToolAbout({ tool }: { tool: Tool }) {
  const { locale, t } = useI18n()
  const text = localizedTool(tool, locale)
  return (
    <details className="group rounded-2xl border border-line/70 bg-surface/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <span className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4 text-accent" />
          {t.tool.aboutTitle}
        </span>
        <span
          aria-hidden="true"
          className="text-xs text-muted transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-line/60 px-5 py-5">
        <p className="max-w-[70ch] text-sm leading-6 text-muted">
          {text.description}
        </p>
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow text-muted">{t.tool.formats}</dt>
            <dd className="mt-1.5 text-ink">
              {tool.supportedFormats.join(' · ')}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted">{t.tool.stack}</dt>
            <dd className="mt-1.5 text-ink">{tool.stack.join(' · ')}</dd>
          </div>
          <div>
            <dt className="eyebrow text-muted">{t.tool.license}</dt>
            <dd className="mt-1.5 font-mono-ui text-xs text-ink">
              {tool.license}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted">{t.tool.updated}</dt>
            <dd className="mt-1.5 font-mono-ui text-xs text-ink" dir="ltr">
              {tool.updatedAt}
            </dd>
          </div>
        </dl>
        <div className="rounded-xl border border-line/70 bg-accent-soft/25 px-4 py-3">
          <ProcessingNote tool={tool} />
        </div>
        {tool.repoUrl && (
          <ButtonLink
            href={tool.repoUrl}
            external
            variant="outline"
            className="gap-2 px-4 py-2.5 text-xs"
          >
            <GithubIcon className="h-4 w-4" />
            {t.contribute.viewOnGithub}
          </ButtonLink>
        )}
      </div>
    </details>
  )
}

/** Optional full-width action row between the header and the workspace. */
export function ToolAppBar({ children }: { children: ReactNode }) {
  return (
    <div className="tool-bar flex min-h-[var(--bar-h)] flex-wrap items-center gap-x-3 gap-y-2 border-b border-line/70 bg-surface/70 px-4 py-2.5 sm:px-5">
      {children}
    </div>
  )
}

/** Related tools, kept below the fold so the workspace owns the first screen. */
export function ToolRelated({ tools }: { tools: Tool[] }) {
  const { t } = useI18n()
  const saved = useSavedTools()
  return (
    <section>
      <Eyebrow>{t.tool.relatedTitle}</Eyebrow>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((candidate) => (
          <ToolCard
            key={candidate.slug}
            tool={candidate}
            saved={saved.isSaved(candidate.slug)}
            onToggleSave={saved.toggle}
          />
        ))}
      </div>
    </section>
  )
}
