# Waqf Toolkit

A collection of free, open-source digital tools for the Muslim community. Local-first, privacy-respecting, and honestly labelled — every project states what it does today and what it does not do yet.

**Status:** early development. The site is live; most tools are in the design or experimental phase. See the [tool directory](https://github.com/SalehAlobaylan/waqf-toolkit#readme) for per-project status.

## Principles

1. **Local first** — tools process your files on your own device. If a tool needs a network call, the interface says so before you use it.
2. **Honest status** — every project is labelled `Available`, `Experimental`, or `Planned`. Unfinished work is never presented as finished.
3. **Limits are visible** — each tool documents its calculation methodology and data sources.
4. **Open stack** — everything is open source under OSI-approved licenses (Apache-2.0, MIT, GPL-3.0, AGPL-3.0 depending on the project).

## Tools

| Tool | Category | Status | What it does |
|---|---|---|---|
| Link Cleaner | Everyday | Available | Clean tracking parameters out of shared links |
| Video Music Remover | Media | Experimental | Separate voice from background music in video |
| Subtitle Cleaner | Media | Experimental | Clean subtitle files without changing meaning |
| Image Metadata Remover | Privacy | Planned | Remove hidden metadata from images |
| Video Face Blur | Privacy | Planned | Blur sensitive areas in video |
| PDF Merger | Documents | Planned | Merge and reorder PDFs |
| PDF Page & Text Extractor | Documents | Planned | Split pages and extract text from PDFs |
| Audio Trimmer & Converter | Media | Planned | Trim and convert audio locally |
| Image Redaction | Privacy | Planned | Blur sensitive areas in screenshots |
| Prayer Times Widget | Everyday | Planned | Prayer times with documented methodology |

The catalog lives in [`src/data/tools.ts`](src/data/tools.ts). Editing rules are documented at the top of that file.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React, SSR) + TanStack Router
- TanStack Query — live GitHub stats and issues
- TanStack Form — suggestion form
- Tailwind CSS v4
- Bilingual: English and Arabic with full RTL support (`/en`, `/ar`)

## Development

Requires Node 20+ and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev        # start dev server on :3000
pnpm build      # production build
pnpm lint       # eslint
pnpm typecheck  # type-check
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first — note that tools involving religious calculations (prayer times, Hijri dates, inheritance, etc.) require review from domain-knowledgeable maintainers before merge.

## Relationship to Waqf Platform

Waqf Toolkit is an independent open-source project. It is showcased inside the [Waqf Platform](https://waqf-platform.vercel.app/) ecosystem via the [`waqf.json`](docs/waqf-json.md) project manifest, but has no build-time or runtime dependency on it.

## Privacy stance on analytics

This site collects **no analytics and no telemetry**. There are no trackers,
no cookies, and no third-party requests beyond fonts. The only external API
calls are read-only GitHub API requests for public repository data. If usage
signals are ever needed, the decision will be documented here first —
self-hosted, privacy-respecting solutions only.

## License

[Apache-2.0](LICENSE)
