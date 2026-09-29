/**
 * Tool layout metadata — the shell's half of the app template.
 *
 * This module is deliberately dependency-free (no React, no tool imports) for
 * two reasons. `components/ui.tsx` needs the pane types and must not drag the
 * tool bundle into pages that never mount a tool; and each tool component
 * reads its *own* layout from here so it can render its own `Workspace` and
 * its own action bar, which a route-level wrapper could not do — the bar's
 * handlers live inside the tool. Keeping the metadata here avoids a cycle
 * between the registry and the tools.
 *
 * `components/tool-card.tsx`-style presentation decisions live with the
 * components; this is the source of truth for *shape*.
 */
export const PANE_IDS = ['panel', 'stage', 'inspector'] as const

export type PaneId = (typeof PANE_IDS)[number]

export type ToolTemplate = 'app' | 'document'

export type ToolLayout = {
  /**
   * `app` — the tool IS the page: full-viewport workspace, contextual header,
   * no footer, panes scroll independently at `lg`+.
   * `document` — a tightened prose column for informational entries.
   */
  template: ToolTemplate
  /**
   * Region order. This is BOTH the DOM order a tool must render its
   * `Workspace.Pane`s in and the grid track order — `workspaceGridClasses`
   * derives the template from this array, so if the two ever disagree the
   * wide `stage` track silently lands on the wrong pane. `data/tools.test.ts`
   * asserts each tool's JSX matches. Convention: lead with `stage` when the
   * conclusion is what the user came for, and with `panel` for editors.
   */
  panes: readonly PaneId[]
  /**
   * Drop the `--shell-w` cap and use the whole viewport width. Only for tools
   * whose artifact genuinely benefits — large canvases.
   */
  bleed?: boolean
  /** Source directory under `src/tools/`, for the METHODOLOGY.md link. */
  dir: string
  /**
   * Which pane takes the wider of the two fixed tracks. Defaults to
   * `inspector`. Card Studio sets it to the preview rail so the picker keeps
   * the slack at every width.
   */
  wide?: PaneId
  /**
   * Which pane waits for `xl` when the workspace has three panes. Defaults to
   * `inspector`. Deferring the wrong one hides the artifact on a 1024px
   * screen, so it is declared per tool rather than assumed.
   */
  defer?: PaneId
}

export const TOOL_LAYOUTS: Record<string, ToolLayout> = {
  // Text-first: the picker (stage) is the work and keeps the slack; the
  // canvas is a wide side rail. At `lg` the assembly rail is what gives way,
  // because a preview you cannot see is worse than frame controls you must
  // scroll to.
  'card-studio': {
    template: 'app',
    panes: ['panel', 'stage', 'inspector'],
    bleed: true,
    wide: 'inspector',
    defer: 'panel',
    dir: 'card-studio',
  },
  'prayer-times-widget': {
    template: 'app',
    panes: ['stage', 'panel'],
    dir: 'prayer-times',
  },
  'qibla-finder': {
    template: 'app',
    panes: ['stage', 'panel', 'inspector'],
    dir: 'qibla-finder',
  },
  'hijri-converter': {
    template: 'app',
    panes: ['stage', 'panel', 'inspector'],
    dir: 'hijri-converter',
  },
  'zakat-calculator': {
    template: 'app',
    panes: ['stage', 'panel'],
    dir: 'zakat-calculator',
  },
  // Leads with the stage: the counter is what the tool is for, so on mobile
  // it lands above the fold instead of a screen down behind the set picker.
  'adhkar-companion': {
    template: 'app',
    panes: ['stage', 'panel', 'inspector'],
    dir: 'adhkar-companion',
  },
}
