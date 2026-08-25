# PRODUCT.md — Waqf Toolkit

> Free, open-source digital tools for the Muslim community. Local-first,
> privacy-respecting, honestly labelled.

This document defines what Waqf Toolkit is, who it serves, how it grows, and
what it will never do. For developer setup see [README](README.md); for
continuation context see [HANDOFF.md](HANDOFF.md); for contribution rules see
[CONTRIBUTING.md](CONTRIBUTING.md).

---

## 0. The goal

**Make tools reachable and clean.**

- **Reachable** — a visitor gets to the right tool in seconds, from any page,
  in either language: tools listed directly in the navigation, search on the
  home page, usable (`Available` / `Experimental`) tools sorted first in the
  directory, runnable tools embedded on their own detail pages.
- **Clean** — no clutter, no branding theater. Tool names describe what the
  tool does, pages lead with the work rather than marketing copy, and every
  element earns its place. Clean surfaces signal trustworthy software.

Every design and copy decision should be checked against these two words.
When reachability and polish conflict, reachability wins.

## 1. The problem

Muslim communities produce and consume a lot of digital material — recorded
lectures, community photos, shared links, scanned documents, subtitles,
prayer-time apps — and the mainstream tooling around these tasks is hostile:

- **Privacy-hostile defaults**: free online converters that upload your files
  to unknown servers, EXIF location data silently attached to family event
  photos, click-tracking parameters riding along on every shared link.
- **Community-specific needs ignored**: removing background music from a
  lecture recording, preparing clean subtitled clips, blurring faces in
  community footage — real tasks with no dedicated, trustworthy tools.
- **Trust deficit**: people are asked to hand sensitive material to black-box
  services because no transparent alternative exists.

## 2. Who it's for

| Persona | Example need |
|---|---|
| Content creators and lecturers | Clean up lecture recordings, prepare shareable clips and captions |
| Community organizers | Blur faces in event footage, strip metadata before publishing photos |
| Everyday users | Share clean links, redact screenshots, merge PDFs without uploading them |
| Developers and contributors | A well-governed open-source project where small useful tools get built properly |

## 3. Product principles

These four rules govern every tool accepted into the toolkit. They are also
stated publicly on the website — they are commitments, not marketing.

1. **Local first.** Tools process files on the user's device. If a tool ever
   needs a network call, the interface says so plainly *before* use.
2. **Honest status.** Every project is labelled `Available`, `Experimental`,
   or `Planned`. Unfinished work is never presented as finished.
3. **Limits are visible.** Each tool documents its methodology and data
   sources. Anything involving religious calculations requires named sources,
   explicit conventions, and stricter review (see CONTRIBUTING.md).
4. **Open stack.** Everything is open source under OSI-approved licenses.
   Inspectable, forkable, auditable.

## 4. What the product is

Two layers, deliberately separated:

**a) The directory (shipped).** A bilingual (English / Arabic, full RTL)
website that catalogs every tool with its status, stack, license, formats,
and privacy note. Users can search by task or format, filter by category and
status, and save tools for later. No account, no cookies, no tracking.

**b) Runnable tools (growing).** Tools whose processing fits in a browser run
*inside* this site — no install, nothing leaves the device (pattern:
`src/tools/` registry). Larger or compute-heavy tools live as separate
repositories under their own licenses and are linked from the directory once
public. The catalog currently tracks ten utilities:

| Tool | Job | Status |
|---|---|---|
| Link Cleaner | Strip tracking parameters from shared links | **Available** (in-app) |
| Video Music Remover | Separate voice from background music in video | Experimental |
| Subtitle Cleaner | Clean subtitle files without changing meaning | Experimental |
| Image Metadata Remover | Remove hidden metadata from images | Planned |
| Video Face Blur | Blur faces/screens/sensitive areas in video | Planned |
| PDF Merger | Merge and reorder PDFs | Planned |
| PDF Page & Text Extractor | Split pages and extract text from PDFs | Planned |
| Audio Trimmer & Converter | Trim and convert audio locally | Planned |
| Image Redaction | Cover sensitive areas in screenshots | Planned |
| Prayer Times Widget | Prayer times with fully documented methodology | Planned |

Every planned/experimental item has a public tracking issue; progress happens
in the open.

## 5. What makes a tool "good" here

A clear, small job beats a big promise. Concretely, an accepted tool:

- Does one task end-to-end without accounts or uploads (or documents exactly
  why it cannot)
- States its privacy behavior in one plain sentence
- Works in English and Arabic (RTL included)
- Is maintainable by a small team: boring tech choices, tested logic
- If it computes anything religiously significant: documents every convention
  with named references and passes domain review

## 6. Non-goals

- **No accounts, servers, or databases.** Nothing to log into, nothing to leak.
- **No analytics or telemetry** — including "privacy-friendly" ones, until the
  decision is revisited publicly (stance documented in README).
- **No religious rulings.** Tools present documented calculations and
  conventions; they never present themselves as authoritative verdicts.
- **No growth at the cost of honesty.** A tool stays `Planned` until it truly
  works, even if the roadmap looks slow.
- **No lock-in to the Waqf Platform.** The toolkit runs and ships
  independently; integration is metadata + public APIs only.

## 7. Ecosystem position

Waqf Toolkit is the first showcased project inside the **Waqf Platform**
(private repo, https://waqf-platform.vercel.app) — the ecosystem layer that
connects Islamic digital projects with developers and volunteers. The
relationship is intentionally loose: the platform discovers this project via
the [`waqf.json` manifest](docs/waqf-json.md) and the public GitHub API
(issues, good-first-issues, contributors, releases). Neither side imports the
other's code. Other projects can adopt the same manifest format.

## 8. Roadmap

**Near term**
- Finish and promote the two experimental tools (Video Music Remover, Subtitle Cleaner)
- Grow in-app runnable tools following the Link Cleaner pattern
- Complete the project card inside Waqf Platform (metadata + Explore /
  Contribute buttons + live good-first-issues feed)

**Mid term**
- Ship the six planned utility tools (Image Metadata Remover, Video Face Blur,
  PDF Merger, PDF Page & Text Extractor, Audio Trimmer & Converter,
  Image Redaction)
- Build the Prayer Times Widget under the enhanced domain-review process,
  with every calculation convention explicit and testable

**Long term**
- Make `waqf.json` a reusable standard other projects adopt
- Desktop builds (e.g. Tauri) for heavier tools so "local first" holds even
  for demanding processing
- Contributor pipeline flowing from Waqf Platform volunteer matching into
  this repository

## 9. How success is measured

Without analytics, success looks like this:

- **Adoption signals we can see**: GitHub stars, forks, contributors, issue
  engagement, external packages/forks of individual tools
- **Contribution health**: first-time contributors landing via
  `good first issue`, domain experts joining reviews
- **Ecosystem proof**: Waqf Platform card live, second project adopting
  `waqf.json`
- **Trust**: users can trace every claim on the site — every status label,
  privacy note, and license matches reality

If those move, the product works — even though we will never be able to put a
number on daily visitors, by design.

## 10. Licensing

Project scaffolding and the website: Apache-2.0. Individual tools may choose
MIT, Apache-2.0, GPL-3.0, or AGPL-3.0 per their needs — each states its
license in the catalog and its own repository.
