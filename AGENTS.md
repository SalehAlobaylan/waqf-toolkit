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

**One language at a time.** Each surface renders entirely in the active locale — never mix Arabic and English labels on one screen, export, or print. **A translation appears in the English UI only; Arabic shows Arabic and nothing else.** Exempt in both locales: sacred Arabic text (always present as content), proper nouns and codes (`Bukhari 6306`, `Hisn`, `v1.0.0`, `PNG`, filenames), and numerals (which follow the user's digit preference, not the locale).

The consequence is a data requirement, not a rendering one: any prose field a surface shows needs an Arabic sibling, or the Arabic surface leaks English. `DuaEntry` carries `titleAr` / `hisnRefAr`; `DatasetRecord` carries a required `nameAr`; `ReviewState` renders through `cardStudio.review*` labels, never the raw enum. `card-studio/data.test.ts` and `data/datasets.test.ts` fail the build if one is missing. A transliterated citation like `Bukhari 6306` needs no sibling — it is a proper noun. A label like `Hisn ch. 27` does.

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
- **Tool pages have two templates.** `app` (the tool *is* the page: full-viewport workspace, contextual header, no footer) and `document` (a prose record). The choice lives in `src/lib/panes.ts` (`TOOL_LAYOUTS`) — never in the catalog, never in a route file.
- **A tool renders its own `<Workspace>`.** The shell owns *space* (width, height, scroll ownership); the tool owns *arrangement*. The action bar's handlers live inside the tool, so the route must not wrap it.
- **`panes` is both DOM order and grid order.** `workspaceGridClasses` derives the grid from that array, so rendering the `Workspace.Pane`s in a different order than declared puts the wide `stage` track on the wrong pane with no error. `src/data/tools.test.ts` asserts it.
- **Grid templates must be literals.** Tailwind extracts class names by scanning source text, so `` `lg:grid-cols-[${tracks}]` `` emits no CSS at all. Add new pane combinations to `WORKSPACE_GRID` in `src/components/ui.tsx` as full strings.
- **The artifact pane is marked `fill`, not inferred from its id.** The shell owns space; the tool owns arrangement — including which of its panes holds the canvas. A `fill` pane fits its cell and does not scroll.
- **A tool's `wide`/`defer` must be declared, not assumed.** `wide` picks the larger fixed track and `defer` picks the pane that waits for `xl`. Wrong values fail silently, so every new combination needs a literal in `WORKSPACE_GRID` (`components/ui.test.ts` enforces it).
- **Search folds the script it searches.** `card-studio/engine/search.ts` strips tashkeel and unifies أإآٱ/ا, ى/ي, ة/ه so an unvocalised query matches vocalised corpus text. Never apply folding to the text you render — only to the comparison.
- **A long picker in a rail must be a disclosure.** Card Studio's 23 template thumbnails are ~1340px in a 264–360px rail. Wrap it in `<details open={state} onToggle={…}>`, and put the current selection in the `<summary>` so a closed picker never hides what is applied. Same for dataset/provenance lists.
- **Order a rail by the flow, smallest-to-refinement-last.** Card Studio: add → chosen blocks → template. Don't lead with a 3-row list and bury the only way to add content at the bottom.
- **Inside a workspace pane, use container variants — never `sm:`/`lg:`.** Panes are `@container`s 264–360px wide (or 600–1900px for a stage), and a viewport breakpoint fires regardless of which one it lands in, so `sm:grid-cols-3` becomes three 90px fields in a rail. Use `@lg:` (512px) to split in two, `@2xl:` (672px) for three, `@3xl:` (768px) for four or more. `src/lib/panes.test.ts` enforces this.
- **A flexible grid track is `minmax(0,1fr)`, never `1fr`** — `1fr` cannot shrink below its content, so a fixed sibling column overflows the pane.
- **Workspace panes are solid, not glass.** The budget in `DESIGN.md` caps heavy blur at first-level surfaces, and `.glass-panel::before` is `inset: 0` — at viewport size its conic ring sweeps the whole screen. Use `--surface-pane`.
- **Never lock the body for the workspace.** Put the height on the grid, let panes scroll internally, and let the page keep scrolling — the Adhkar booklet and the Card Studio sheet print through their own portals and need normal document flow (see the print block in `app.css`).
- **Logical properties only inside a workspace** — `ps/pe/ms/me/border-e/border-s`, never `left-`/`right-`. `grid-cols-*` is physical, so the first pane lands on the right under `dir="rtl"`, which is the correct convention.
- **The layout budget is tokenised** in `app.css`: `--header-h`, `--header-h-app`, `--shell-w`, `--measure`, `--pane-w`, `--app-h`, `--strip-h`. Don't reintroduce `72px` or `max-w-[1240px]` as literals.
- **The `?b=` deep link is router-validated.** `tools/$slug.tsx` omits the key when absent; returning `{ b: undefined }` instead makes `search` required on every `<Link>` to that route and breaks typecheck app-wide.
- **`/tools/<slug>/try` is retired** and 301s to the tool page. Card Studio share links target `/tools/card-studio?b=…`; don't add `/try` URLs back to the sitemap.
- `.tanstack/`, `dist/`, and generated files are gitignored — don't commit them.

## Git conventions

- Commit style: short imperative summary line, optional body explaining the why. No AI attribution or co-author lines in commits, ever.
- `main` is protected: PRs require one approval and passing CI. Do not force-push.
- Keep PRs focused: one feature or fix each. Use the PR template in `.github/`.
