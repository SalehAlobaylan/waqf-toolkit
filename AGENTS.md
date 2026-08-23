# AGENTS.md — Waqf Toolkit

Instructions for AI coding agents working in this repository.

## What this project is

Waqf Toolkit is a public, open-source collection of digital tools for the Muslim community. It is a **tool directory website** (this repo) that showcases individual tool projects. Principles that must survive every change:

1. **Local first** — tools run on the user's device; any network call must be explicit.
2. **Honest status** — never label unfinished work as `Available`.
3. **Limits are visible** — calculation methodology and data sources are documented.

It is intentionally independent from the private `waqf-platform` repo: no imports, no shared builds, no secrets linking them. Integration happens only through the public `waqf.json` manifest and GitHub metadata.

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

**Catalog edits (`src/data/tools.ts`):**
- `status: 'available'` only when the repository is public and usable end-to-end.
- `repoUrl` must point to a real, public repository; omit it otherwise (the UI shows "not published yet").
- Keep privacy notes literally accurate about where processing happens.

**Sensitive domain changes** (prayer times, Hijri dates, Qibla, Zakat, inheritance, Quran/Hadith data): document methodology + named data sources in code or README, expect extra review, never merge without a domain-knowledgeable maintainer sign-off.

**No secrets, ever:** no tokens, credentials, `.env` files, private API endpoints, or dependencies on private repos. This is a fully public repository.

## Known gotchas

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
