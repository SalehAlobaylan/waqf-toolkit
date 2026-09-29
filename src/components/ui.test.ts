import { describe, expect, it } from 'vitest'
import { deferredPane, workspaceGridClasses } from '@/components/ui'
import { PANE_IDS, TOOL_LAYOUTS, type PaneId, type ToolLayout } from '@/lib/panes'

/**
 * `workspaceGridClasses` is the only place the app template's geometry is
 * decided, and CI cannot see a rendered pixel — so the shape it produces is
 * asserted directly. The failures this file is here to prevent are both
 * silent: a missing literal emits no CSS at all, and a mis-declared `defer`
 * hides a pane rather than erroring.
 */
const layout = (
  panes: readonly PaneId[],
  extra: Partial<ToolLayout> = {},
): ToolLayout => ({ template: 'app', panes, dir: '', ...extra })

const three: PaneId[] = ['stage', 'panel', 'inspector']
const two: PaneId[] = ['stage', 'panel']

describe('workspaceGridClasses', () => {
  it('always stacks into one column and bounds the height at lg', () => {
    for (const l of [layout(two), layout(three)]) {
      const classes = workspaceGridClasses(l)
      expect(classes).toContain('grid-cols-1')
      expect(classes).toContain('lg:h-[var(--app-h)]')
      expect(classes).toContain('lg:overflow-hidden')
      expect(classes).toContain('min-h-0')
    }
  })

  it('gives the stage the flexible track and the others fixed ones', () => {
    expect(workspaceGridClasses(layout(['panel', 'stage', 'inspector']))).toContain(
      'lg:grid-cols-[var(--pane-w)_minmax(0,1fr)]',
    )
  })

  it('derives the track order from the declared pane order', () => {
    expect(workspaceGridClasses(layout(['stage', 'panel']))).toContain(
      'lg:grid-cols-[minmax(0,1fr)_var(--pane-w)]',
    )
    expect(workspaceGridClasses(layout(['stage', 'panel', 'inspector']))).toContain(
      'lg:grid-cols-[minmax(0,1fr)_var(--pane-w)]',
    )
  })

  it('defers a third pane to xl by default', () => {
    const threePane = workspaceGridClasses(layout(['panel', 'stage', 'inspector']))
    expect(threePane).toContain(
      'xl:grid-cols-[var(--pane-w)_minmax(0,1fr)_var(--pane-inspector-w)]',
    )
    expect(threePane).not.toMatch(/lg:grid-cols-\[[^\]]*inspector-w/)
  })

  it('gives a two-pane tool both tracks at lg with no xl override', () => {
    expect(workspaceGridClasses(layout(two))).not.toContain('xl:grid-cols')
  })

  it('lets a tool keep the slack on the picker and give up the assembly rail', () => {
    // Card Studio: `defer: 'panel'` means the two-column layout at lg is
    // picker + preview, and the canvas is never the pane that disappears.
    const classes = workspaceGridClasses(
      layout(['panel', 'stage', 'inspector'], { wide: 'inspector', defer: 'panel' }),
    )
    expect(classes).toContain('lg:grid-cols-[minmax(0,1fr)_var(--pane-preview-w)]')
    expect(classes).toContain(
      'xl:grid-cols-[var(--pane-w)_minmax(0,1fr)_var(--pane-preview-w)]',
    )
    expect(classes).not.toContain('--pane-inspector-w')
  })

  it('caps the width unless the tool asks to bleed', () => {
    expect(workspaceGridClasses(layout(two))).toContain('max-w-[var(--shell-w)]')
    expect(workspaceGridClasses(layout(two), true)).toContain('w-full')
    expect(workspaceGridClasses(layout(two), true)).not.toContain('max-w-[var(--shell-w)]')
  })

  it('resolves a real grid template for every registered tool', () => {
    for (const [slug, l] of Object.entries(TOOL_LAYOUTS)) {
      const classes = workspaceGridClasses(l, l.bleed)
      expect(classes, slug).toContain('grid-cols-1')
      expect(
        classes,
        `${slug} (${l.panes.join('>')} wide=${l.wide ?? '-'} defer=${l.defer ?? '-'}) has no grid template; add it to WORKSPACE_GRID as a literal`,
      ).toMatch(/grid-cols-\[/)
      for (const pane of l.panes) {
        expect(PANE_IDS, `${slug}: ${pane}`).toContain(pane)
      }
    }
  })

  it('falls back to a single column for an unknown pane combination', () => {
    const classes = workspaceGridClasses(layout(['inspector', 'stage']))
    expect(classes).toContain('grid-cols-1')
    expect(classes).not.toMatch(/grid-cols-\[/)
  })
})

describe('deferredPane', () => {
  it('defers nothing when there are only two panes', () => {
    expect(deferredPane(two)).toBeUndefined()
    expect(deferredPane(two, 'panel')).toBeUndefined()
  })

  it('defaults the third pane to the inspector', () => {
    expect(deferredPane(three)).toBe('inspector')
  })

  it('honours an explicit choice', () => {
    expect(deferredPane(three, 'panel')).toBe('panel')
  })

  it('never defers a pane the tool does not declare', () => {
    for (const [slug, l] of Object.entries(TOOL_LAYOUTS)) {
      if (l.defer) {
        expect(l.panes, `${slug} defers a pane it does not declare`).toContain(l.defer)
      }
    }
  })
})
