# HANDOFF.md — Context for future agents

Start here if you are picking up this repository in a new session. Read this
file top-to-bottom before making changes. Last updated: 2026-08-24 (v0.1.0
shipped).

## What this project is

**Waqf Toolkit** — a collection of free, open-source digital tools for the
Muslim community. Local-first, privacy-respecting, honestly labelled. The
website is a bilingual directory plus host for runnable client-side tools.

Tone rules for all copy: formal but slightly casual. **No Islamic slogans or
decorative religiosity** — plain, honest language only. Bilingual: every
user-facing string exists in English and Arabic.

### Ecosystem position (do not violate this boundary)

- **Waqf Platform** (`waqf-platform` repo, private) = ecosystem/discovery/
  coordination layer at https://waqf-platform.vercel.app
- **This toolkit** (this repo, public) = an independent open-source project
- Relationship is *loose coupling*: the platform showcases this project via
  the `waqf.json` manifest and public GitHub API. **Never import toolkit code
  into the platform or make either depend on the other's builds.**
  Spec: [docs/waqf-json.md](docs/waqf-json.md)

## Facts

- Repo: https://github.com/SalehAlobaylan/waqf-toolkit (public, Apache-2.0)
- Live: https://waqf-toolkit.vercel.app (Vercel auto-deploys from `main`)
- Owner/contact: [@SalehAlobaylan](https://github.com/SalehAlobaylan)
- Stack: TanStack Start (SSR) + Router + Query + Form, Tailwind CSS v4,
  TypeScript (**pinned ~5.9** — do not upgrade to TS 7 until
  typescript-eslint supports it), Vitest, ESLint flat config
- Locales: `/en` (default) and `/ar` (RTL). Root path negotiates
  Accept-Language.
- Branch protection on `main`: 1 approval + required CI check named `build`.
  Admin bypasses are currently allowed (`enforce_admins` off) — direct pushes
  print a "bypassed rule violations" warning; that is expected.

## Key files

| Path | Purpose |
|---|---|
| `src/data/tools.ts` | The tool catalog (10 tools). Editing rules in the header comment |
| `src/i18n/en.ts`, `src/i18n/ar.ts` | All UI strings. Must stay key-identical (test-enforced) |
| `src/tools/link-cleaner/` | First runnable tool: tracker list + `cleanUrl()` logic |
| `src/tools/registry.tsx` | Maps tool slug → runnable interface component |
| `src/routes/$locale/…` | Localized pages (home, directory, detail, try, contribute, splat 404) |
| `src/lib/site.ts` | `SITE_URL` canonical origin constant |
| `docs/waqf-json.md` | Manifest spec consumed by Waqf Platform |
| `docs/templates/calculation-methodology.md` | Required template for religious-calculation tools |

## Project-specific gotchas

1. **Server-only imports**: never import `@tanstack/react-start/server`
   directly in a route file — the client bundle build fails with
   "import-protection". Wrap with `createIsomorphicFn()` (see
   `src/routes/index.tsx` Accept-Language negotiation for the pattern).
2. **`notFoundComponent` renders OUTSIDE the layout** (no header/footer, no
   `I18nProvider`). Use `getDictionary(locale)` from `@/i18n` there, never
   `useI18n()`. See `$locale/route.tsx`.
3. **Adding a tool**: append to `TOOLS` in `src/data/tools.ts`, then update
   `public/sitemap.xml` (a test fails CI if a slug is missing), add strings
   to both dictionaries, and create/link a roadmap issue.
   `status: 'available'` requires a real public `repoUrl` (test-enforced).
4. **Saved-tools store**: `useSyncExternalStore` snapshot must be cached;
   don't re-read storage per call. Tests cover this.
5. `routeTree.gen.ts` is generated — never edit it.
6. Run `pnpm lint && pnpm test && pnpm typecheck && pnpm build` before any
   push. CI runs exactly these.

## Remaining work

### 1. Waqf Platform integration (the big one)

Build the Toolkit's project card inside the **private `waqf-platform` repo**
(located sibling at `~/Desktop/MyRepos/Waqf-Platform`, deployed at
https://waqf-platform.vercel.app/ar):

- Static card from `waqf.json` metadata: name, description, categories,
  license badge, stack, preview screenshot(s) of the toolkit
- Buttons: `Explore Toolkit` → live site, `Contribute` → GitHub repo,
  `View Source`
- Live section fetching from GitHub API (client-side, read-only):
  open issues, `good first issue` items, contributors, releases
- Longer term: a generic renderer that reads ANY project's `waqf.json`, so
  other projects onboard the same way (Toolkit is just the first)
- Take screenshots of the toolkit site for the card

### 2. Ship the remaining tools

Roadmap issues #1–#8 track each one (Video Music Remover, Image Metadata
Remover, Video Face Blur, PDF Merger, PDF Page & Text Extractor, Audio
Trimmer & Converter, Image Redaction, Prayer Times Widget).
Subtitle Cleaner (experimental, no issue yet) also needs finishing.
Rules: small scope, client-side processing, honest status labels.
**Prayer Times Widget (issue #8) is calculation-sensitive** — must complete
`docs/templates/calculation-methodology.md` and pass domain review per
CONTRIBUTING.md before merge.

New runnable tools plug in via: component in `src/tools/<name>/` +
entry in `src/tools/registry.tsx` + `tryRoute: true` in the catalog.

### 3. Manual tasks (only the human can do these)

- Upload social preview image: repo Settings → General → Social preview →
  upload `public/og.png` (GitHub API does not support this)
- Optional: set `SITE_URL` env var on Vercel if the domain ever changes

### 4. Later / ideas

- More experimental tools promoted to Available as they ship
- Releases: tag on meaningful milestones; keep CHANGELOG.md updated
- Analytics: deliberately none (stance documented in README). Revisit only
  with self-hosted privacy-respecting tooling, documented first
- Accessibility: jsx-a11y linting is in place; a full screen-reader pass has
  not been done yet

## Suggested skills

- `improve` — for auditing the codebase before large refactors
- `handoff` — refresh this document at the end of a session
