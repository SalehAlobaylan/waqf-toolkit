# AGENTS.md — Waqf Toolkit

Instructions for AI coding agents working in this repository.

## What this project is

Waqf Toolkit is a public, open-source collection of digital tools for the Muslim community. It is a **web tools site** (this repo): a directory plus in-browser runnable tools. Every tool is a website — open the link and use it instantly from any device, nothing to install. Principles that must survive every change:

1. **Instant & everywhere** — tools are web pages; no installs, no accounts required.
2. **Honest status** — never label unfinished work as `Available`.
3. **Limits are visible** — calculation methodology, data sources, AND exactly where processing happens (the user's browser / our server / a named third-party API) are documented on every tool page.

It is intentionally independent from the private `waqf-platform` repo: no imports, no shared builds, no secrets linking them. Integration happens only through the public `waqf.json` manifest and GitHub metadata.

## Deployment

Vercel is the **temporary** host. No host-specific config files live in this repository — no `vercel.json`, no `api/` serverless functions.

The single, deliberate exception is in `vite.config.ts`: the Nitro plugin with `preset: 'vercel'`, gated behind `process.env.VERCEL === '1'` so it activates **only** on Vercel's build runners. Vercel physically cannot serve TanStack Start SSR without it (the build must emit a serverless function). Local builds and every other host always produce the standard Node output (`dist/server/server.js`). When the project moves off Vercel, delete this conditional — nothing else changes.

## Commands

```sh
pnpm install          # setup
pnpm dev              # dev server on :3000
pnpm build            # production build
pnpm lint             # eslint (flat config)
pnpm typecheck        # tsc --noEmit
```

Run `pnpm lint && pnpm typecheck && pnpm build` before finishing any task. CI enforces all three.

## Stack & structure

- TanStack Start (SSR) + TanStack Router (file-based), TanStack Query, TanStack Form, Tailwind CSS v4, TypeScript 5.9 (pinned — do not upgrade to TS 7; typescript-eslint does not support it).
- Route tree is generated in `src/routeTree.gen.ts` — never edit it by hand.

```
src/
├── routes/
│   ├── __root.tsx           # html shell; lang/dir derived from URL
│   ├── index.tsx            # "/" → redirect to /en
│   └── $locale/
│       ├── route.tsx        # locale layout + localized notFoundComponent
│       ├── $.tsx            # catch-all → throws notFound() for bad paths
│       ├── index.tsx        # home
│       ├── tools.index.tsx  # directory
│       ├── tools.$slug.tsx  # tool detail
│       └── contribute.tsx   # contribution info + suggestion form
├── data/tools.ts            # THE tool catalog
├── i18n/{en,ar}.ts, index.tsx
├── lib/                     # github API fetchers, saved-tools store
└── components/
```

## Hard rules

**Bilingual or it doesn't ship.** Every user-facing string goes in BOTH `src/i18n/en.ts` and `src/i18n/ar.ts`. Arabic copy must read naturally, not machine-translated. The dictionary types enforce key parity — if `tsc` passes, keys match. Never hardcode UI text in components.

**Tone:** formal but slightly casual. No Islamic slogans or decorative religiosity — plain, honest language only.

**Catalog edits (`src/data/tools.ts`):**
- `status: 'available'` only when the tool is usable end-to-end here on the site.
- `repoUrl` must point to a real, public repository; omit it otherwise (the UI shows "not published yet").
- Keep `processingNote` literally accurate about where processing happens; set `processing` (`browser` | `server` | `cloud-api`) accordingly, and name providers under `providers` when third-party APIs are involved.
- Adding a tool also means adding it to `public/sitemap.xml` in both locales (a test fails CI if a slug is missing) plus strings in both dictionaries and a roadmap issue.

**Cloud integrations (future):** provider keys (LLMs, Deepgram, Tavily, …) live only in server environment variables behind our own server functions/proxy — never in client code. Each tool page must disclose which services receive data before use.

**Sensitive domain changes** (prayer times, Hijri dates, Qibla, Zakat, inheritance, Quran/Hadith data): document methodology + named data sources in code or README, expect extra review, never merge without a domain-knowledgeable maintainer sign-off.

**No secrets, ever:** no tokens, credentials, `.env` files, private API endpoints, or dependencies on private repos. This is a fully public repository.

## Known gotchas

- **Server-only imports**: never import `@tanstack/react-start/server` directly in a route file — the client bundle fails with an import-protection error. Wrap with `createIsomorphicFn()` (see `src/routes/index.tsx` Accept-Language negotiation).
- **`notFoundComponent` renders outside the layout** — so outside `I18nProvider`. Use `getDictionary(locale)` from `@/i18n` there, never `useI18n()` (SSR will crash).
- **Typed router links**: prefer `<Link to="/$locale" params={{ locale }}>`. Template-literal hrefs like `` to={`/${locale}`} `` fail typecheck under TS 5.9. For dynamic path switching (e.g., language toggle preserving the current path), use a plain `<a>`.
- **Hash/external links**: `ButtonLink` handles `#…` and `http…` hrefs as plain anchors automatically; don't route them through `<Link>`.
- **`useSyncExternalStore` snapshots must be cached** (see `src/lib/saved-tools.ts`) — returning fresh objects each call breaks React 19.
- Unknown locales (e.g. `/fr`) must return **404**, not 500 — handled by `beforeLoad` in `$locale/route.tsx`; keep it that way.
- `dir="rtl"` is set server-side on `<html>` from the URL in `__root.tsx`; test layout in both directions when touching CSS.
- `.tanstack/`, `dist/`, and generated files are gitignored — don't commit them.

## Git conventions

- Commit style: short imperative summary line, optional body explaining the why. No AI attribution or co-author lines in commits, ever.
- `main` is protected: PRs require one approval and passing CI. Do not force-push.
- Keep PRs focused: one feature or fix each. Use the PR template in `.github/`.
