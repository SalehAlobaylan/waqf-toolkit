import { createFileRoute, redirect } from '@tanstack/react-router'
import { getTool } from '@/data/tools'

/**
 * Permanent redirect for the retired `/tools/<slug>/try` pages.
 *
 * The tool interface now lives on the tool page itself, so `/try` was a
 * redundant second page that rendered the same tool in the same 860px
 * column. It is kept as a 301 rather than a 404 because inbound links
 * exist: Card Studio share links were generated against `/try` before they
 * were repointed, and they are copied between devices.
 */
export const Route = createFileRoute('/$locale/tools/$slug_/try')({
  beforeLoad: ({ params }) => {
    const slug = params.slug
    if (!getTool(slug)) {
      throw redirect({ href: `/${params.locale}/tools`, statusCode: 302 })
    }
    throw redirect({
      href: `/${params.locale}/tools/${slug}`,
      statusCode: 301,
    })
  },
})
