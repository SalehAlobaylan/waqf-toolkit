import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Tool interfaces render inside a `Workspace.Pane`, which is 264–360px wide —
 * or about 600–1900px for a `stage`. A viewport breakpoint cannot tell those
 * apart: `sm:grid-cols-3` fires at a 640px *viewport* and then lands three
 * columns inside a 300px rail, i.e. 90px-wide form fields and 65px-wide
 * template thumbnails.
 *
 * So the rule is: inside a tool, horizontal layout responds to the container
 * (`@lg:`, `@2xl:` …), never to the viewport (`sm:`, `lg:` …). The pane itself
 * carries `@container`.
 *
 * CI cannot see a rendered pixel, so this asserts the source instead.
 */
const TOOL_DIR = 'src/tools'

function toolComponents(): string[] {
  return readdirSync(TOOL_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(TOOL_DIR, entry.name))
    .flatMap((dir) =>
      readdirSync(dir)
        .filter((file) => file.endsWith('-try.tsx'))
        .map((file) => join(dir, file)),
    )
}

const LAYOUT_VARIANTS = '(grid-cols|col-span|flex-row|w-\\[|max-w-\\[|flex-wrap)'

describe('tool panes use container queries, not viewport breakpoints', () => {
  it('no tool uses a viewport breakpoint for horizontal layout', () => {
    const offenders: string[] = []
    // `tool-hero` renders inside a stage pane, so it is subject to the same
    // rule as the tools themselves.
    for (const file of [...toolComponents(), 'src/components/tool-hero.tsx']) {
      const source = readFileSync(file, 'utf-8')
      // Negative lookbehind so `@lg:grid-cols-2` is not flagged.
      const pattern = new RegExp(`(?<![@\\w-])(sm|md|lg|xl):${LAYOUT_VARIANTS}`, 'g')
      for (const match of source.matchAll(pattern)) {
        offenders.push(
          `${file}:${source.slice(0, match.index).split('\n').length}  ${match[0]}`,
        )
      }
    }
    expect(
      offenders,
      `Use a container variant (@lg:, @2xl:, @3xl:) so the grid responds to the pane width:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('every pane declares @container', () => {
    const ui = readFileSync('src/components/ui.tsx', 'utf-8')
    const pane = ui.slice(ui.indexOf('tool-pane'))
    expect(pane).toContain('@container')
  })

  it('a flexible grid track never lacks minmax(0, …)', () => {
    // `1fr` is `minmax(auto, 1fr)`: it cannot shrink below its content, so a
    // fixed sibling column overflows the pane. This is a real bug in
    // ToolHeroBody before it was given `minmax(0,1fr)`.
    const files = [
      ...toolComponents(),
      'src/components/tool-hero.tsx',
      'src/components/ui.tsx',
      'src/components/tool-app.tsx',
    ]
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf-8')
      for (const match of source.matchAll(/grid-cols-\[([^\]]+)\]/g)) {
        const tracks = match[1].split('_')
        tracks.forEach((track, index) => {
          const isFlexible = track.endsWith('fr') && !track.includes('minmax')
          const isLast = index === tracks.length - 1
          if (isFlexible && !isLast) {
            offenders.push(`${file}  ${match[0]}`)
          }
        })
      }
    }
    expect(offenders, 'a middle `1fr` track can push a fixed column out of the pane').toEqual([])
  })
})
