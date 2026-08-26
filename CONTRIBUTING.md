# Contributing to Waqf Toolkit

Thank you for considering a contribution. This project works because people notice small, awkward tasks and fix them properly.

## Getting started

```sh
git clone https://github.com/SalehAlobaylan/waqf-toolkit.git
cd waqf-toolkit
pnpm install
pnpm dev
```

## Ground rules

- **Small scope beats big promises.** A tool should do one job well. If your idea needs three paragraphs to explain, consider splitting it.
- **Web-first and instant.** Tools run in the browser from any device — no installs, no accounts. Any network call beyond the user's own browser must be explicit in the UI, documented in the tool's processing note (exactly where data goes), and routed through our own server proxy with keys kept server-side.
- **Honest status.** Never ship something labelled `Available` that is not usable end-to-end. The catalog rules are in `src/data/tools.ts`.
- **No secrets in the repo.** No credentials, tokens, private API endpoints, or `.env` files — ever.
- Keep changes focused. One pull request per feature or fix.

## Pull requests

1. Fork or branch from `main`.
2. Make your change with tests where practical.
3. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` locally — CI must pass.
4. Open a PR using the template and link any related issues.
5. All PRs require at least one maintainer review before merge.

## Sensitive domain review (important)

Tools involving **religious calculations or content** — prayer times, Hijri calendar conversion, Qibla direction, Zakat computation, inheritance shares, Quran/Hadith data handling — are held to a higher standard:

- Calculation methodology and data sources must be documented in the tool's README or code comments, with named references (e.g. which convention for Fajr angle, which Umm al-Qura variant, etc.).
- These changes require review from at least one maintainer with relevant domain knowledge, in addition to normal code review.
- Expect slower merges here. That is intentional.
- If you have expertise in these areas, domain reviews are among the most valuable contributions you can make.

## Good first issues

Look for issues labelled [`good first issue`](https://github.com/SalehAlobaylan/waqf-toolkit/labels/good%20first%20issue). They are scoped to be approachable without deep context.

## Translations

The site is bilingual (English / Arabic) via `src/i18n/`. When adding user-facing strings, add them to both `en.ts` and `ar.ts`. Arabic copy should read naturally, not machine-translated; ask if you want a native speaker to check your phrasing.

## Reporting problems

- Bugs: open a [bug report](https://github.com/SalehAlobaylan/waqf-toolkit/issues/new?template=bug_report.md).
- Security issues: do **not** open a public issue. See [SECURITY.md](SECURITY.md).
