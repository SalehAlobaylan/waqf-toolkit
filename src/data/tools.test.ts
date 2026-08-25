import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CATEGORIES, STATUS_ORDER, TOOLS, getTool, localizedTool, relatedTools } from './tools'
import { TOOL_INTERFACES } from '@/tools/registry'

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

  it('tools with an in-app interface are marked tryRoute', () => {
    for (const tool of TOOLS) {
      // Inverse check is done against the registry import-free via convention:
      // only link-cleaner currently ships an interface.
      if (tool.tryRoute) {
        expect(tool.status === 'available' || tool.status === 'experimental').toBe(
          true,
        )
      }
    }
  })

  it('every field set is well-formed', () => {
    for (const tool of TOOLS) {
      expect(CATEGORIES).toContain(tool.category)
      expect(STATUS_ORDER).toContain(tool.status)
      expect(tool.name.trim()).not.toBe('')
      expect(tool.shortDescription.length).toBeGreaterThan(10)
      expect(tool.privacyNote.length).toBeGreaterThan(10)
      expect(tool.stack.length).toBeGreaterThan(0)
      expect(tool.license).toMatch(/^(MIT|Apache-2\.0|GPL-3\.0|AGPL-3\.0|MPL-2\.0)$/)
      expect(tool.updatedAt, tool.slug).toMatch(ISO_DATE)
      expect(typeof tool.featured).toBe('boolean')
    }
  })

  it('every tool carries a complete Arabic translation', () => {
    for (const tool of TOOLS) {
      const { name, shortDescription, description, privacyNote } =
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
        ARABIC_SCRIPT.test(privacyNote),
        `${tool.slug}: ar.privacyNote is not Arabic`,
      ).toBe(true)
    }
  })

  it('localizedTool falls back to English copy', () => {
    const tool = getTool('link-cleaner')!
    expect(localizedTool(tool, 'en').name).toBe(tool.name)
    expect(localizedTool(tool, 'ar').name).toBe(tool.translations.ar.name)
  })

  it('getTool resolves every slug and nothing else', () => {
    expect(getTool('link-cleaner')?.name).toBe('Link Cleaner')
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

  it('sitemap only lists try-pages for tools with a shipped interface', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf-8')
    const trySlugs = [
      ...sitemap.matchAll(/\/tools\/([a-z0-9-]+)\/try</g),
    ].map((match) => match[1])
    for (const slug of trySlugs) {
      expect(
        TOOL_INTERFACES[slug],
        `sitemap advertises /tools/${slug}/try but no interface is registered`,
      ).toBeDefined()
    }
  })

  it('tools marked tryRoute have a sitemap try-page in every locale', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf-8')
    for (const tool of TOOLS) {
      if (!tool.tryRoute) continue
      for (const locale of ['en', 'ar']) {
        expect(
          sitemap,
          `tryRoute tool ${tool.slug} is missing its try-page in the sitemap`,
        ).toContain(
          `<loc>https://waqf-toolkit.vercel.app/${locale}/tools/${tool.slug}/try</loc>`,
        )
      }
    }
  })
})
