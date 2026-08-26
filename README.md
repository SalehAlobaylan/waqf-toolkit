# Waqf Toolkit

A collection of free, open-source web tools for the Muslim community. Nothing to install — every tool opens right in your browser, states exactly where your data goes, and is labelled honestly about what works today.

**Status:** early development. The site is live; most tools are in the design or experimental phase. See the [tool directory](https://github.com/SalehAlobaylan/waqf-toolkit#readme) for per-project status.

## Principles

1. **Instant & everywhere** — tools are websites: open the link and use them from any device. No installs, no accounts.
2. **Honest status** — every project is labelled `Available`, `Experimental`, or `Planned`. Unfinished work is never presented as finished.
3. **Limits are visible** — each tool documents its calculation methodology, its data sources, and exactly where processing happens: your browser, our server, or a named third-party API.
4. **Open stack** — everything is open source under OSI-approved licenses (Apache-2.0, MIT, GPL-3.0, AGPL-3.0 depending on the project).

## Tools

| Tool | Category | Status | What it does |
|---|---|---|---|
| Link Cleaner | Everyday | Available | Clean tracking parameters out of shared links |
| Video Music Remover | Media | Experimental | Separate voice from background music in video |
| Subtitle Cleaner | Media | Experimental | Clean subtitle files without changing meaning |
| Image Metadata Remover | Privacy | Planned | Remove hidden metadata from images |
| Video Face Blur | Privacy | Experimental | Blur sensitive areas in video |
| PDF Merger | Documents | Planned | Merge and reorder PDFs |
| PDF Page & Text Extractor | Documents | Planned | Split pages and extract text from PDFs |
| Audio Trimmer & Converter | Media | Planned | Trim and convert audio in the browser |
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
calls today are read-only GitHub API requests for public repository data.

If tools gain cloud capabilities (e.g. AI providers such as Deepgram,
Tavily, DeepSeek, or OpenAI), requests will run through our own server proxy:
provider keys will never touch the browser, and each tool page will disclose
exactly which services receive data *before* you use the tool. If usage
signals are ever needed, that decision will be documented here first —
self-hosted, privacy-respecting solutions only.

## License

[Apache-2.0](LICENSE)
