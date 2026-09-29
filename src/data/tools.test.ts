import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CATEGORIES, STATUS_ORDER, TOOLS, getTool, localizedTool, relatedTools } from './tools'
import { TOOL_COMPONENTS } from '@/tools/registry'
import { PANE_IDS, TOOL_LAYOUTS } from '@/lib/panes'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ARABIC_SCRIPT = /[\u0600-\u06FF]/

describe('tool catalog invariants', () => {
  it('slugs are unique and kebab-case', () => {
    const slugs = TOOLS.map((tool) => tool.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('available tools link to a public repository', () => {
    for (const tool of TOOLS) {
      if (tool.status === 'available') {
        expect(
          tool.repoUrl,
          `${tool.slug} is marked available but has no repoUrl`,
        ).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/)
      }
    }
  })

  it('a tool is only Available once it ships a runnable surface', () => {
    for (const tool of TOOLS) {
      if (tool.status === 'available') {
        expect(
          TOOL_COMPONENTS[tool.slug],
          `${tool.slug} is marked available but has no runnable interface`,
        ).toBeDefined()
      }
    }
  })

  it('every registered tool maps to a catalog slug and a layout', () => {
    expect(
      Object.keys(TOOL_COMPONENTS).sort(),
      'components and layouts disagree; every component needs a layout entry',
    ).toEqual(Object.keys(TOOL_LAYOUTS).sort())
    for (const slug of Object.keys(TOOL_COMPONENTS)) {
      expect(
        getTool(slug),
        `registry lists ${slug} but the catalog does not`,
      ).toBeDefined()
      const layout = TOOL_LAYOUTS[slug]
      expect(layout.panes.length, `${slug} declares no panes`).toBeGreaterThan(0)
      for (const pane of layout.panes) {
        expect(PANE_IDS, `${slug} declares unknown pane ${pane}`).toContain(pane)
      }
      expect(
        new Set(layout.panes).size,
        `${slug} declares a duplicate pane`,
      ).toBe(layout.panes.length)
      expect(
        layout.panes,
        `${slug} must put the artifact in the stage pane`,
      ).toContain('stage')
      expect(layout.dir.trim(), `${slug} has no source directory`).not.toBe('')
    }
  })

  it('every field set is well-formed', () => {
    for (const tool of TOOLS) {
      expect(CATEGORIES).toContain(tool.category)
      expect(STATUS_ORDER).toContain(tool.status)
      expect(tool.name.trim()).not.toBe('')
      expect(tool.shortDescription.length).toBeGreaterThan(10)
      expect(tool.processingNote.length).toBeGreaterThan(10)
      expect(['browser', 'server', 'cloud-api']).toContain(tool.processing)
      expect(tool.stack.length).toBeGreaterThan(0)
      expect(tool.license).toMatch(/^(MIT|Apache-2\.0|GPL-3\.0|AGPL-3\.0|MPL-2\.0)$/)
      expect(tool.updatedAt, tool.slug).toMatch(ISO_DATE)
      expect(typeof tool.featured).toBe('boolean')
    }
  })

  it('every tool carries a complete Arabic translation', () => {
    for (const tool of TOOLS) {
      const { name, shortDescription, description, processingNote } =
        tool.translations.ar
      expect(name.trim(), `${tool.slug}: ar.name is empty`).not.toBe('')
      expect(
        ARABIC_SCRIPT.test(shortDescription),
        `${tool.slug}: ar.shortDescription is not Arabic`,
      ).toBe(true)
      expect(
        ARABIC_SCRIPT.test(description),
        `${tool.slug}: ar.description is not Arabic`,
      ).toBe(true)
      expect(
        ARABIC_SCRIPT.test(processingNote),
        `${tool.slug}: ar.processingNote is not Arabic`,
      ).toBe(true)
    }
  })

  it('localizedTool falls back to English copy', () => {
    const tool = getTool('qibla-finder')!
    expect(localizedTool(tool, 'en').name).toBe(tool.name)
    expect(localizedTool(tool, 'ar').name).toBe(tool.translations.ar.name)
  })

  it('getTool resolves every slug and nothing else', () => {
    expect(getTool('qibla-finder')?.name).toBe('Qibla Finder')
    expect(getTool('does-not-exist')).toBeUndefined()
  })

  it('relatedTools excludes the current tool and dedupes', () => {
    const tool = getTool('video-music-remover')!
    const related = relatedTools(tool)
    expect(related).toHaveLength(3)
    expect(new Set(related.map((candidate) => candidate.slug)).size).toBe(3)
    expect(related.map((candidate) => candidate.slug)).not.toContain(
      'video-music-remover',
    )
  })

  it('each tool renders its panes in declared order', () => {
    // The grid tracks are derived from TOOL_LAYOUTS[slug].panes, so a tool
    // whose JSX renders them in a different order gets the wide `stage` track
    // on the wrong pane — a silent layout bug with no runtime error.
    const files: Record<string, string> = {
      'card-studio': 'src/tools/card-studio/card-studio-try.tsx',
      'prayer-times-widget': 'src/tools/prayer-times/prayer-times-try.tsx',
      'qibla-finder': 'src/tools/qibla-finder/qibla-try.tsx',
      'hijri-converter': 'src/tools/hijri-converter/hijri-converter-try.tsx',
      'zakat-calculator': 'src/tools/zakat-calculator/zakat-calculator-try.tsx',
      'adhkar-companion': 'src/tools/adhkar-companion/adhkar-try.tsx',
    }
    for (const [slug, file] of Object.entries(files)) {
      const source = readFileSync(file, 'utf-8')
      const rendered = [...source.matchAll(/<Workspace\.Pane id="(\w+)"/g)].map(
        (match) => match[1],
      )
      expect(
        rendered,
        `${slug} renders ${rendered.join('>')} but declares ${TOOL_LAYOUTS[slug].panes.join('>')}`,
      ).toEqual([...TOOL_LAYOUTS[slug].panes])
    }
  })

  it('sitemap covers every tool in every locale', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf-8')
    for (const locale of ['en', 'ar']) {
      for (const path of ['', '/tools', '/contribute']) {
        expect(sitemap).toContain(
          `<loc>https://waqf-toolkit.vercel.app/${locale}${path}</loc>`,
        )
      }
      for (const tool of TOOLS) {
        expect(
          sitemap,
          `sitemap is missing /${locale}/tools/${tool.slug}`,
        ).toContain(`https://waqf-toolkit.vercel.app/${locale}/tools/${tool.slug}<`)
      }
    }
  })

  it('the sitemap advertises no retired try-pages', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf-8')
    expect(sitemap).not.toContain('/try')
  })
})
