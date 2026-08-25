# Changelog

All notable changes to Waqf Toolkit are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]

### Changed

- "Frosted orchard" glass system generalized across the site: soft
  ambient olive/clay washes behind every page, and translucent blurred
  surfaces (cards, buttons, menus, form fields, search bars) with a
  specular top edge — text stays solid ink for contrast. Falls back to
  opaque surfaces when `backdrop-filter` is unsupported.
- Home page redesigned around a full-width "dawn" gradient hero panel:
  centered headline, search bar as the primary action, floating category
  tiles, and a glass "Most used" card. The header is transparent over
  the hero and gains its paper surface on scroll.
- Tools renamed from brand-style names to descriptive names, in both
  languages and in their URL slugs (e.g. `Saut` → `Video Music Remover`,
  `Miftah Link` → `Link Cleaner` at `/tools/link-cleaner`). Old slugs are
  not redirected.

## [0.1.0] — 2026-08-24

### Added

- Bilingual (English/Arabic, RTL) marketing and directory site built on
  TanStack Start: home, toolkit directory with search/filters/saved tools,
  tool detail pages, contribute page with live GitHub data.
- **Link Cleaner** — first runnable tool: strips known tracking parameters
  from links, fully client-side (`/tools/link-cleaner/try`).
- Tool catalog of ten utilities with honest status labels
  (Available / Experimental / Planned).
- Test suite (Vitest) covering catalog invariants, i18n key parity,
  URL-cleaning logic, and the saved-tools store.
- Open-source governance: Apache-2.0 LICENSE, CONTRIBUTING with a
  sensitive-domain review policy, Code of Conduct, Security policy,
  issue/PR templates, CODEOWNERS, Dependabot, CI.
- `waqf.json` project manifest (spec v1) for Waqf Platform integration,
  documented in `docs/waqf-json.md`.
- SEO: hreflang alternates, Accept-Language locale negotiation, sitemap,
  robots.txt, Open Graph tags and image.

[Unreleased]: https://github.com/SalehAlobaylan/waqf-toolkit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/SalehAlobaylan/waqf-toolkit/releases/tag/v0.1.0
