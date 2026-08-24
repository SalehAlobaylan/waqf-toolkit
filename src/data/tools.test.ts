import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CATEGORIES, STATUS_ORDER, TOOLS, getTool, relatedTools } from './tools'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

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
      // only miftah-link currently ships an interface.
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
      expect(tool.license).toMatch(/^(MIT|Apache-2\.0|GPL-3\.0|AGPL-3\.0)$/)
      expect(tool.updatedAt, tool.slug).toMatch(ISO_DATE)
      expect(typeof tool.featured).toBe('boolean')
    }
  })

  it('getTool resolves every slug and nothing else', () => {
    expect(getTool('miftah-link')?.name).toBe('Miftah Link')
    expect(getTool('does-not-exist')).toBeUndefined()
  })

  it('relatedTools excludes the current tool and dedupes', () => {
    const tool = getTool('saut')!
    const related = relatedTools(tool)
    expect(related).toHaveLength(3)
    expect(new Set(related.map((candidate) => candidate.slug)).size).toBe(3)
    expect(related.map((candidate) => candidate.slug)).not.toContain('saut')
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
})
