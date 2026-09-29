# Tool Page — Density Plan (v2)

> **Status:** IMPLEMENTED. Phases 0–4 are done; Phase 5 (optional polish) is
> not. Deviations from the plan and one judgment call are listed in §12.
> **Supersedes:** the first draft of this document. The analysis in §1 still
> holds and is reused here. The architecture in the first draft (§3–§5) is
> **withdrawn** — it fixed width and deliberately preserved the vertical dead
> zones, and it contained a self-contradiction: an identity header stacked
> above a `100dvh - header` workspace means the workspace's bottom edge is
> always below the fold. That is a dead zone, not a layout.
> **Scope:** the tool page template, the site header on tool routes, and the
> six tool interfaces. New dependencies: **zero**.
> **Last updated:** 2026-09-28

---

## 0. The thesis in one paragraph

The tool page is a **marketing page with an app stapled underneath**. A
back link, an icon, a title, a sentence, two buttons and a fake panel title
bar sit above the tool — about 39% of the first screen — and then the actual
tool is a narrow column in the middle of a wide display. Both are dead zone:
vertical space carrying nothing, and horizontal space carrying nothing. The
fix is not a wider container. The fix is that **the tool becomes the page**,
the chrome collapses to a sliver, the artifact owns the viewport, and prose
moves into a disclosure below the fold. On mobile nothing is removed — the
same content is simply denser.

---

## 1. Analysis (unchanged from v1 — verified against the code)

### 1.1 Both dead zones, measured

**Vertical.** Tool page at 1440×900. First screen below the 72px header = 828px.

| Before one line of tool UI | px | Source |
| --- | --- | --- |
| `pt-8` | 32 | `tools.$slug.tsx:50` |
| back link | 18 | `:51-59` |
| `mt-6` | 24 | `:61` |
| icon + h1 row | 56 | `:63-74` |
| `mt-3` + description | 36 | `:76-78` |
| `mt-4` + button row | 56 | `:80-120` |
| `mt-6` | 24 | `:124` |
| fake panel title bar | 40 | `:128-134` |
| panel padding `sm:p-5` | 40 | `:135` |
| **total** | **326px (39%)** | |

The remaining 502px shows a toolbar and the top of a block list. In Card
Studio the artifact — the canvas — is in section 5 of 9, roughly 1,400px down.
You scroll two screens to reach what you came for.

**Horizontal.** The 860px cap appears in exactly **three** places, all in tool
routes: `tools.$slug.tsx:50`, `tools.$slug_.try.tsx:46`, `:69`. Everything
else on the site is wider — directory `max-w-[1240px]`
(`tools.index.tsx:180`), home bands `max-w-[1240px]`, header/footer
`max-w-[1240px]` (`site-chrome.tsx:163,305,357`). **A tool gets 30% less
width than the directory that lists it.** At 1440px that is `(1440−860)/2 =
290px` of nothing on each side.

**Internal.** `py-8` / `sm:py-10` on the Prayer Times and Hijri result zones,
`space-y-4` / `gap-6` between sections, `pb-20` (80px) empty tail on every
page. Six `<details>` disclosures and one `role="tablist"` exist purely to
work around the missing horizontal room.

### 1.2 `/try` is not just redundant, it is worse

Both branches use the same `max-w-[860px]` (`:46`, `:69`). The default branch
adds a *larger* identity block than the detail page — `CategoryTile large` is
`h-16 w-16`, `h1` is `text-[32px] sm:text-5xl`, gaps are `mt-8`
(`tools.$slug_.try.tsx:79-96`). Roughly 400px+ of dead zone before the tool,
and it still gets 860px. It buys nothing and costs the most.

### 1.3 No height ownership anywhere

Zero occurrences of `dvh`, `100dvh`, `h-screen` or `svh` in the repo. The
header height is a hardcoded `72px` in one place (`site-chrome.tsx:163`). No
layout custom property exists in `app.css`. So nothing can claim the viewport
and no region can scroll independently.

### 1.4 No seam for a tool to opt out of site chrome

`$locale/route.tsx:32-36` renders `<SiteHeader />` and `<SiteFooter />`
unconditionally. No root `Layout`, no route context, no `useMatches` check.

### 1.5 A tell: `md:` appears in no tool file

`sm:` is used 16 times across the six tools. `lg:` once —
`hijri-converter-try.tsx:274`, `lg:grid-cols-[1.45fr_0.85fr]`, which resolves
to ~460px + 340px *inside* 860px. `md:` zero times. The breakpoint ladder was
never designed for these surfaces.

### 1.6 What is already good and must not be lost

The sub-`lg` single-column flow is genuinely well built. Every disclosure
widget, the `featuredId` focus model in Adhkar, the Card Studio tablist, the
save/print/export flows — all tuned for 375px. This plan **removes dead space
from that flow**; it does not restructure it.

---

## 2. The new tool page

### 2.1 Anatomy

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◈  Card Studio  ● experimental          [Save] [GitHub] [AR] [☰]   56px  │  contextual header
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────────────────────┬──────────────────────┐   │
│ │              │                              │                      │   │
│ │    panel     │            stage             │     inspector        │   │
│ │  (controls)  │        (the artifact)        │   (options, export)  │   │
│ │              │                              │                      │   │
│ │  scrolls     │       fits, centres          │      scrolls         │   │
│ └──────────────┴──────────────────────────────┴──────────────────────┘   │
│  ↻ undo  redo │ open  save                                          56px  │  workspace bar
├──────────────────────────────────────────────────────────────────────────┤
│ ⓘ Runs entirely in your browser · Methodology · dataset v3    32px       │  status strip
└──────────────────────────────────────────────────────────────────────────┘
        ↓ page continues scrolling, workspace stays a bounded box
   ▸ About this tool                                                        │
   ▸ Related tools                                                           │
```

### 2.2 What was deleted, and why

| Removed from the fold | Was | Why it is dead |
| --- | --- | --- |
| back link | `tools.$slug.tsx:51-59` | the header logo already goes home; the header shows the tool name |
| `CategoryTile` + eyebrow + status pill | `:63-74` | status is a 6px dot in the header; the icon is decoration |
| `h1` at `text-[32px]` | `:70-72` | moves to a 14px header label; stays in `<title>` and OG meta (`:22-30`) |
| short description | `:76-78` | moves into the About disclosure |
| "Open the tool" button | `:81-90` | the tool is already open — the button points at the page you are on |
| Save / GitHub buttons | `:103-119` | both move into the header |
| fake panel title bar | `:128-134` | 40px that says "Card Studio │ Try it" — the header now says it |
| `pt-8`, `mt-6` × 2, `pb-20` | `:50` | the workspace starts at y = header height |

Net: **326px of vertical dead zone and 580px of horizontal dead zone removed
from the first screen**, and the artifact is above the fold instead of 1,400px
down.

### 2.3 The two templates

Every tool page is one of exactly two templates. This is the whole system.

| | `app` | `document` |
| --- | --- | --- |
| Used by | all 6 live tools | 8 archived tools, future informational entries |
| Width | fluid, no max-width | `--measure` prose column |
| Height | `calc(100dvh - var(--header-h-app))` | auto |
| Header | contextual, 56px | full marketing nav, 72px |
| Footer | suppressed | rendered |
| Arrangement | 1 / 2 / 3 panes | single column |
| Pane scroll | each pane | window |
| Prose | About disclosure below | in flow |

**All six live tools become `app`.** There is no third mode. The registry
decides, per tool, how many panes it has — not which template.

### 2.4 Responsive contract

| Concern | `< lg` | `lg` – `< xl` | `>= xl` |
| --- | --- | --- | --- |
| Panes | 1 (DOM source order) | 2 (panel + stage) | 3 (panel + stage + inspector) |
| Height | `auto` — window scrolls | `var(--app-h)` — panes scroll | `var(--app-h)` — panes scroll |
| Pane dividers | hairline `border-b` | logical `border-e` / `border-s` | same |
| Page padding | `px-4` | `px-5` | `px-6` |
| Disclosure widgets | unchanged | unchanged | unchanged |

**Two panes at `lg`, three at `xl`.** The first draft's single 3-pane layout
at 1024px would give the stage ~480px after two 240px panes. That is a dead
zone created by the fix, which is exactly what this plan exists to prevent.

### 2.5 What changes on mobile, and why it is not a compromise

| | Today | After |
| --- | --- | --- |
| header | logo + hamburger, 72px | logo + tool name + hamburger, 56px |
| before the tool | title, description, buttons (~330px) | nothing — the tool starts at y=56 |
| tool flow | one column, source order | **identical** one column, source order |
| panes | n/a | all `grid-cols-1` below `lg` |
| below the tool | processing note, related tools | status strip, About disclosure, related tools |

The tool's own layout is untouched. The only change is that dead space is
removed. The hamburger menu keeps the full navigation, so nothing is lost.

---

## 3. Architecture

### 3.1 Layout tokens

`app.css` `@theme` — replaces magic numbers that currently exist only as
literals:

```css
--header-h: 72px;          /* site-chrome.tsx:163 */
--header-h-app: 56px;      /* contextual tool header */
--shell-w: 1240px;         /* directory, home, contribute */
--measure: 860px;          /* document-template prose column */
--pane-w: clamp(240px, 22vw, 340px);
--pane-inspector-w: clamp(240px, 20vw, 360px);
--app-h: calc(100dvh - var(--header-h-app));
--surface-pane: var(--color-surface);
--bar-h: 56px;
--strip-h: 32px;
```

`h-[72px]` appears exactly once, so this is a one-line change.

### 3.2 The surface registry

`tryRoute` is a fact duplicated between the catalog (`tools.ts:43`) and
`TOOL_INTERFACES` (`registry.tsx:6-21`), and `tools.test.ts:29-42` exists only
to assert the two agree. Presentation facts belong with the presentation code.

`src/tools/registry.tsx`:

```ts
export type ToolSurface = {
  Component: ComponentType
  template: 'app' | 'document'
  panes: readonly ('panel' | 'stage' | 'inspector')[]
  bleed?: boolean
}

export const TOOL_SURFACES: Record<string, ToolSurface> = {
  'card-studio':       { Component: CardStudioTry,       template: 'app', panes: ['panel', 'stage', 'inspector'], bleed: true },
  'prayer-times-widget': { Component: PrayerTimesTry,    template: 'app', panes: ['panel', 'stage'] },
  'adhkar-companion':  { Component: AdhkarTry,           template: 'app', panes: ['panel', 'stage', 'inspector'] },
  'qibla-finder':      { Component: QiblaTry,            template: 'app', panes: ['panel', 'stage', 'inspector'] },
  'zakat-calculator':  { Component: ZakatCalculatorTry,  template: 'app', panes: ['panel', 'stage'] },
  'hijri-converter':   { Component: HijriConverterTry,   template: 'app', panes: ['panel', 'stage', 'inspector'] },
}
```

`bleed: true` on Card Studio: its artifact is a 1080×1920 canvas that benefits
from every extra pixel. The others sit at the shell width so the panes stay a
comfortable reading width and the stage does not become a void.

`tryRoute` is deleted from `Tool` and from all six entries. The
`isHybrid` slug list (`tools.$slug_.try.tsx:42`) disappears with the route.

### 3.3 New components

`src/components/tool-app.tsx`:

| Export | Role |
| --- | --- |
| `ToolAppHeader` | 56px contextual header: logo, tool name, status dot, save, repo, locale, menu |
| `ToolAppShell` | the bounded box: `h-[var(--app-h)]`, grid, per-pane scroll |
| `ToolAppBar` | optional 56px action row above the grid (Card Studio's undo/save) |
| `StatusStrip` | 32px persistent disclosure bar — `processingNote`, methodology, dataset version |
| `ToolAbout` | collapsed `<details>` below the workspace: description, formats, stack, license, updated, repository |

`src/components/ui.tsx` gains the pane primitives:

```tsx
<Workspace panes={surface.panes} bleed={surface.bleed}>
  <Workspace.Pane id="panel">…</Workspace.Pane>
  <Workspace.Pane id="stage">…</Workspace.Pane>
  <Workspace.Pane id="inspector">…</Workspace.Pane>
</Workspace>
```

`Workspace` is **stateless**. It must not own a pane switcher — that would
change mobile behaviour, and mobile is already correct.

The grid, entirely in CSS:

| Rule | Value |
| --- | --- |
| columns | `grid-cols-1 lg:grid-cols-[var(--pane-w)_minmax(0,1fr)] xl:grid-cols-[var(--pane-w)_minmax(0,1fr)_var(--pane-inspector-w)]` |
| height | `h-[var(--app-h)] overflow-hidden` |
| pane | `min-w-0 min-h-0 lg:overflow-y-auto lg:overscroll-contain` |
| dividers | `panel` → `lg:border-e`; `inspector` → `xl:border-s` |
| surface | **solid** `bg-surface` — never glass (§6.2) |
| stage | `max-w-[900px] mx-auto w-full` so the artifact centres instead of drifting into a void on wide displays |

`min-w-0 min-h-0` is load-bearing. Without it a grid child refuses to shrink
below its content and a 1080px canvas blows out the grid. Putting it in the
primitive means no tool can get it wrong.

### 3.4 The chrome seam

`src/lib/surface-path.ts` — pure, unit-testable, works in SSR because the
pathname is available there:

```ts
export function templateFor(pathname: string): 'app' | 'document'
```

`$locale/route.tsx` renders `<SiteFooter />` only when the template is
`document`. `SiteHeader` already reads
`useRouterState({ select: s => s.location.pathname })` at `:131` and derives
`transparent` at `:147`; it derives `app` the same way. This mirrors an
existing working pattern and needs no router internals or context plumbing.

`id="main"` (`route.tsx:33`) is the skip-link target and must survive —
`jsx-a11y` is enabled and the skip link is in `site-chrome.tsx:157-162`.

### 3.5 The tool page

`src/routes/$locale/tools.$slug.tsx` branches once on the template:

- **app** → header, optional bar, `Workspace`, `StatusStrip`, `ToolAbout`,
  related tools.
- **document** → one tightened column. No back link above the title (the
  header already carries it), no fake panel, metadata as a two-column
  definition list instead of stacked cards.

---

## 4. Card Studio, region by region

| Current region | Lines | New home |
| --- | --- | --- |
| Toolbar: undo/redo, save project, open | `:473-513` | `ToolAppBar`, full width |
| Chosen blocks list | `:516-567` | panel (top) |
| Add-section tablist + 4 pickers | `:570-744` | panel (below blocks) |
| Template grid | `:747-773` | panel (below add-section) |
| Frame / layout / digits | `:774-804` | inspector |
| Preview canvas | `:808-829` | **stage** |
| Format / resolution / QR | `:831-858` | inspector |
| Export: image, text, JSON, link | `:860-873` | inspector footer; image + link promoted to the bar |
| Batch ZIP | `:877-883` | inspector |
| Provenance / dataset list | `:886-903` | status strip + inspector detail |
| Autosave toggle | `:906-919` | bar |
| Footer note | `:921` | status strip |

Below `lg` the DOM order is `bar → panel → stage → inspector` — the same
vertical order the user scrolls today, with the same `<details>`, the same
four tabs, and the same `useState`. No behaviour change.

**The concrete win:** the preview is `w-full max-w-[420px]` today
(`:825`). In a stage pane sized by height — `max-h-full w-auto
object-contain` — a 1080×1920 story frame renders at true aspect ratio,
roughly 2× larger, with no scrolling to reach it.

---

## 5. The other five tools

Every tool already has the regions; they never had anywhere to put them side
by side. This is close to free.

| Tool | panel | stage | inspector | Effort |
| --- | --- | --- | --- | --- |
| Prayer Times | identity + cities (`:717-816`), controls (`:821-1046`) | result + countdown (`:538-711`) | — | medium — the three zones are already glass siblings split by hairlines (`:713`, `:818`) |
| Qibla | city presets (`:426-510`), live banner (`:514-535`) | dial (`:277-330`) | distance + method (`:332-365`) | low |
| Hijri | controls (`:349-565`) | result (`:265-344`) | variant + JDN card (`:274-299`) | low |
| Zakat | inputs (`:372-521`), advanced (`:526-662`) | hero + breakdown table (`:255-352`) | — | low |
| Adhkar | set picker, list (`:736-802`), print settings (`:805-925`) | focus card (`:610-720`) | display options (`:495-549`) | high — native `<dialog>`, print portal, `document.body` class juggling |

Do them one at a time, Card Studio first, lowest effort next, Adhkar last.

---

## 6. Non-obvious decisions

### 6.1 The workspace is a bounded box, not `body { overflow: hidden }`

The obvious implementation locks the page. That is wrong here, for four
reasons:

1. **Print breaks.** `app.css:511-517` documents that the Adhkar booklet
   "relies on normal document flow, so multi-page sets paginate correctly."
   A viewport-locked page prints as one clipped screen.
2. **The print portal breaks.** `body.printing-adhkar > *:not(#adhkar-print-portal)`
   is a direct-child selector on `<body>`. Restructuring around a locked body
   invites silently breaking it.
3. **`scrollRestoration: true`** (`router.tsx:18`) restores window scroll.
   Panes would reset to top while the page below restored — inconsistent.
4. **AGENTS.md requires visible disclosure.** Methodology, data sources and
   the processing note must be *on* the tool page. A viewport lock plus a
   modal would trade a hard rule for a design win.

So: `height: var(--app-h)` on the grid, per-pane `overflow-y: auto`, page
scroll untouched. The workspace is the first screen; About and related tools
are one scroll away. Nothing is removed from the page. A print reset is added
anyway: `@media print { .tool-app { height: auto; overflow: visible } }`.

### 6.2 Panes are solid, not glass

`DESIGN.md:88-90`: *"heavy blur only on first-level surfaces. If adding a
glass surface inside another glass surface, use a solid tint instead."*
`.glass-panel` is `backdrop-filter: blur(28px) saturate(1.45)`
(`app.css:389-399`), and its `::before` conic ring is `inset: 0;
border-radius: inherit` (`:403-429`) — on a near-viewport element that is a
viewport-sized conic sweep per repaint, over a fixed stage that already runs
three `blur-[110px]` blobs (`$locale/route.tsx:24-30`).

Decision: **panes are solid `bg-surface` with `--color-line` borders.** Glass
stays on small floating things — the menu, popovers, outline buttons. Dense
studio controls read better on a solid surface, and this respects a documented
constraint rather than quietly breaking it.

### 6.3 RTL: let the grid mirror, forbid physical properties

`grid-cols-*` is **physical**. Under `dir="rtl"`, column one renders on the
right, so DOM order `panel, stage, inspector` becomes visually
`inspector, stage, panel` — control panel on the right, which is the start
side in Arabic. Correct, and free.

Rule: every property inside a workspace is logical — `ps-`, `pe-`, `ms-`,
`me-`, `border-e`, `border-s`, `text-start`. Never `pl-`, `pr-`, `left-`,
`right-`. The codebase already does this in places (`ms-3` at
`site-chrome.tsx:182`, `end-0` at `:96`, `ms-2` on disclosure chevrons). This
plan makes it a review criterion and adds it to the AGENTS.md gotchas list.
`dir` is set server-side on `<html>` from the URL (`__root.tsx:77`) — no
change, but both directions get checked on every pane.

### 6.4 Why the header gets its own variant instead of staying 72px

The header is the only chrome left. At 72px on a 900px screen it costs 8% of
the viewport and, worse, it renders `logo | Tools▾ | Contribute | Saved |
GitHub | AR` — five affordances for leaving the tool, in a header you are
already inside. The contextual variant keeps the logo (exit), the tool name
(identity), the status dot (honesty), Save and repo, the locale switch (hard
rule), and the menu (exit to everything else). 56px.

### 6.5 The About disclosure vs "limits are visible"

AGENTS.md: *"Limits are visible — calculation methodology, data sources, AND
exactly where processing happens are documented on every tool page."*

Split of responsibility:

- `StatusStrip` — always visible, 32px, carries the `processingNote` text
  verbatim plus methodology and dataset-version links.
- `ToolAbout` — collapsed `<details>`, carries the long-form description,
  formats, stack, license, updated, repository.

The processing disclosure AGENTS.md names explicitly is therefore always on
screen. The long-form detail is one click away and still in the DOM for
crawlers. **This is a domain judgement the maintainer should confirm** — see
§8 question 1.

---

## 7. Phases

Each is independently shippable; all four checks green before the next
(`lint`, `test`, `typecheck`, `build` — CI runs `test` *before* `typecheck`).

### Phase 0 — Tokens · no visual change

`@theme` tokens; `site-chrome.tsx:163` → `h-[var(--header-h)]`; extract the
header height and pane widths so nothing is a literal. Pure refactor.

### Phase 1 — Retire `/try`

- Delete `tools.$slug_.try.tsx`, replace with a 6-line permanent redirect to
  `/$locale/tools/$slug`. `redirect({ statusCode: 301 })` — verify against
  the installed router (`@tanstack/react-router@^1.170`; `node_modules` was
  not installed during this analysis).
- Delete 12 `<url>` blocks from `public/sitemap.xml` (lines 15, 17, 19, 21, 23,
  25, 38, 40, 42, 44, 46, 48).
- Remove `tryTool` from `en.ts:613-615` **and** `ar.ts:602-604` in one commit.
- Registry → `TOOL_SURFACES`; delete `tryRoute` from `Tool` and all six
  entries; the `isHybrid` slug list goes with the route.
- **Fix the deep-link regression:** `engine/export.ts:241` hardcodes
  `/tools/card-studio/try?b=…`. Every shared card link in the wild 404s
  otherwise, and `shareUrl` is not unit-tested so CI will not catch it.
  Also replace the `window.location.search` read at
  `card-studio-try.tsx:252-272` with typed `validateSearch` on the tool route.
- `robots.txt`: `Disallow: /*/try`.
- Docs: `design-studio-analysis.md:194`, `card-studio-v2-analysis.md:267`.

### Phase 2 — Primitives + Card Studio

`tool-app.tsx`, `Workspace`, `StatusStrip`, `ToolAbout`, `surface-path.ts`,
the conditional footer, the contextual header, the app branch of
`tools.$slug.tsx`, and the Card Studio re-layout. **New bilingual strings in
the same commit.**

This is the phase that removes the dead zones. Everything before it is setup.

### Phase 3 — The document template

Tighten the archived/informational page: drop the back link, metadata as a
definition list, no fake panel. It should read as a record, not a landing page.

### Phase 4 — Roll out

The other five tools, lowest effort first, Adhkar last.

### Phase 5 — Optional

Compact-header refinement, drag-resize on pane dividers, per-pane scroll
restoration, Playwright smoke suite (see §9).

---

## 8. Open questions

1. **Does a collapsed About disclosure satisfy "limits are visible"?** (§6.5)
   The `processingNote` is always on screen; the long description is not.
   If the answer is no, the alternative is a persistent 1-line description
   above the status strip, costing 20px.
2. **Should `bleed` be the default for all six tools?** Recommended no — only
   Card Studio's canvas benefits. But on a 2560px display the other five would
   still have wide margins, which is the exact complaint. A middle option is a
   `clamp()` cap at ~1800px for all app templates.
3. **56px contextual header, or keep 72px full nav?** Keeping it costs ~20px of
   canvas and keeps five "leave the tool" affordances in the header of a tool.
4. **Does Adhkar want a workspace at all?** Its focus-card model is already
   good and it carries the riskiest surface in the repo. "No visible benefit"
   is a credible answer.
5. **Should the directory and home pages get the same density treatment?**
   Out of scope here — sparseness on a browsing page is fine, and this plan
   only justifies itself for tool pages. Flagging it because the tokens from
   Phase 0 make it cheap later.

---

## 9. Verification and the honest gap

**Current state.** Vitest only — no Playwright, no browser in CI
(`.github/workflows/ci.yml`). `vitest.setup.ts` stubs `localStorage` only, no
`matchMedia`. **Zero** `data-testid` assertions anywhere; the ~90 test IDs in
`src/` are manual hooks, so renaming them is free. **Zero** layout, width or
breakpoint assertions. `tsconfig` has `strictNullChecks` but not `strict` and
no `noUnusedLocals` — unused imports fail ESLint, not `tsc`.

**Delete:** `tools.test.ts:29-42` (tryRoute status), `:117-128` (try-page
regex — leaves `TOOL_INTERFACES` unused at `:4` → **lint failure**),
`:130-143` (try-page presence, 12 failures).

**Add:**

| Test | Asserts |
| --- | --- |
| registry ⊆ catalog | every `TOOL_SURFACES` key is a `TOOLS` slug |
| sitemap | every registry slug present in both locales; no `/try` URL remains |
| availability | `status: 'available'` ⟹ a registered surface. Stronger than the `tryRoute` test it replaces |
| `templateFor` | pure table test: `/{en,ar}/tools/{slug}`, trailing slash, unknown slug, non-tool path, `/` |
| `Workspace` classes | table test over `(panes, bleed)` → expected grid string |
| `ToolAppHeader` classes | 56px in app mode, 72px otherwise |
| `shareUrl` | round-trips through `decodeDeepLink`, contains no `/try` (closes the R1 class of bug) |
| `switchLocalePath` | update the stale `/try` fixture at `locale-path.test.ts:8-11` |

**The honest gap:** CI cannot see a single pixel, and nothing in this plan
tests a rendered layout. Density is a visual judgement. A Playwright smoke
pass over 2 viewports × 6 tools is the right follow-up and is called out in
Phase 5 rather than pretended away. Before Phase 2 is marked done, at minimum
manually verify: 375px, 1024px, 1440px, 2560px, in both `en` and `ar`.

---

## 10. Risk register

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | Every existing Card Studio share link 404s — `shareUrl` hardcodes `/try` (`export.ts:241`) and is untested | Phase 1 fixes it before Phase 2; add a unit test |
| R2 | Grid children blow out without `min-w-0 min-h-0` | baked into `Workspace.Pane` |
| R3 | RTL panes on the wrong side | mirror is intended (§6.3); logical properties only; both directions reviewed |
| R4 | Glass GPU cost at viewport size | solid pane surfaces (§6.2) |
| R5 | Print regression | bounded box, body stays scrollable (§6.1) + print media reset |
| R6 | Scroll restoration inconsistency | accepted: panes start at top, page restores normally |
| R7 | `processingNote` disappears with the footer | `StatusStrip` is mandatory in app mode |
| R8 | Sticky/fixed children trapped by a pane stacking context | panes use `overflow-y: auto` only, no `filter`; Adhkar's `<dialog>` is in the top layer and immune |
| R9 | `.paper-noise::after` is `fixed z-50` vs sticky header `z-40` (`app.css:482-490`) | pre-existing, `pointer-events: none` at 3.5% opacity; verify visually |
| R10 | One-sided `i18n` edit fails at `test`, not `typecheck`, with a confusing key-tree diff | Phase 1 lists exact paired line numbers; both files in one commit |
| R11 | Contrast on solid surfaces | spot-check `--color-muted` on `--color-surface` at 11–12px against AA before Phase 2 is done |
| R12 | Six tool files restructured at once | phased, one tool per commit, lowest effort first |
| R13 | Removing the "Open the tool" button changes a user-visible flow | it pointed at the page you were already on; check for inbound links and docs references |
| R14 | Bundle growth | zero new dependencies; 0 kB |

---

## 11. Definition of done

- [ ] `pnpm lint && pnpm test && pnpm typecheck && pnpm build` green
- [ ] Zero `/try` URLs in `public/sitemap.xml`; `/try` 301s
- [ ] Zero `tryRoute` references in `src/`
- [ ] `max-w-[860px]` gone; only `--measure` remains, for the document template
- [ ] No `100dvh` on `body`, no `overflow: hidden` on `html` or `body`
- [ ] **No dead zone above the artifact on any live tool at 1440px** — the
      stage is fully visible without scrolling
- [ ] No `290px` empty margin at 1440px on any live tool
- [ ] Card Studio at 375px: same tool flow, same order, same disclosures
- [ ] Card Studio at 2560px with `bleed`: story frame at true aspect ratio
- [ ] All panes checked in `en` and `ar`, both `dir` values
- [ ] `processingNote` visible on every tool page including app mode
- [ ] Adhkar booklet still prints multi-page, un-clipped
- [ ] New strings in both `en.ts` and `ar.ts`, same commit
- [ ] `DESIGN.md`: workspace surface rule, solid-not-glass panes, two templates
- [ ] `AGENTS.md` gotchas: `--app-h`, logical properties in panes, solid panes
- [ ] Roadmap issue for the Playwright smoke suite


---

## 12. What was actually built

Implemented in this order, each step green on `lint`/`test`/`typecheck`/`build`.

| Phase | Result |
| --- | --- |
| 0 — tokens | `--header-h`, `--header-h-app`, `--shell-w`, `--measure`, `--pane-w`, `--pane-inspector-w`, `--app-h`, `--app-h-chrome`, `--bar-h`, `--strip-h`, `--surface-pane` in `@theme`. `h-[72px]` and `max-w-[1240px]` are gone from components. |
| 1 — retire `/try` | 301 redirect stub kept as `tools.$slug_.try.tsx`; 12 sitemap URLs removed; `Disallow: /*/try`; `tryTool` removed from both dictionaries; `tryRoute` removed from the catalog; `shareUrl()` repointed; the `?b=` param is now router-validated and read with `useSearch`. |
| 2 — primitives | `Workspace` / `Workspace.Pane` in `ui.tsx`; `StatusStrip`, `ToolAbout`, `ToolAppBar`, `ToolRelated` in `tool-app.tsx`; `surface.ts` for the pure pathname→template decision; contextual header + footer suppression; Card Studio re-laid out. |
| 3 — document template | Tightened prose record for informational tools: no back link, metadata in a definition list, no fake panel. |
| 4 — roll-out | All six tools. Verified rendering in both locales. |

### Deviations from the plan

1. **`lib/surface.ts`, not `lib/surface-path.ts`** — it builds GitHub URLs too.
2. **Layout metadata moved to `src/lib/panes.ts`, and the registry is
   components-only.** The plan had one `TOOL_SURFACES` map holding both shape
   and component. That would have made each tool import the registry in order
   to read its own shape — a cycle (registry → tool → registry) — and would
   have dragged all six tool bundles into `ui.tsx` via the pane types.
   `TOOL_LAYOUTS` is a dependency-free leaf; `TOOL_COMPONENTS` holds the JSX.
   A test keeps the two maps in step.
3. **A tool renders its own `<Workspace>`, not the route.** The plan had the
   route wrap the tool. The action bar's undo/save/open handlers live inside
   the tool, so a route-level wrapper cannot host it without lifting all tool
   state into the route. Same boundary, different owner.
4. **The inspector waits for `xl`.** The plan said three panes at `xl` and two
   at `lg`; that is what shipped, but expressed as *"a third pane is hidden at
   `lg`"* rather than two different grid templates, so a two-pane tool fills
   both tracks at `lg` without a special case.
5. **Adhkar's DOM order changed.** See below.

### The one judgment call

Adhkar's focus card sat mid-flow: set picker, search, options, progress, card,
list. Panes are rendered in declared order, so the card either moved to the top
or got buried under the full list. Burial is clearly wrong, so
`TOOL_LAYOUTS['adhkar-companion'].panes` is `['stage', 'panel', 'inspector']`:
progress and the counter first, then the set picker and the list, then display
options. The counter is what the tool exists for, so on mobile it now lands
above the fold instead of a screen down. **This is a UX change, not a layout
refactor, and it is one line to reverse** if the old order is preferred.

### Not done

- Phase 5: compact-header refinement, drag-resize pane dividers, per-pane
  scroll restoration.
- The Playwright smoke suite. CI still cannot see a rendered pixel; the new
  tests cover the pure decisions (template choice, grid classes, pane order,
  deep links), not the rendered result. Manual verification at 375 / 1024 /
  1440 / 2560 in both locales is still required before merge.
- `/tools/<slug>/try` redirect has no automated test — `redirect()` in
  `beforeLoad` is not reachable from the unit suite.


---

## 13. Spacing pass (after review)

The first implementation took "remove dead zone" too literally and stripped
whitespace instead of spacing it properly. Three defects followed, all visible
in Card Studio:

| Defect | Cause | Fix |
| --- | --- | --- |
| **Two tiers of section treatment** — three sections bare, four in `rounded-2xl … bg-surface/40` cards | The old single-column list treated some groups as cards and some as plain sections; the pane split preserved the mix | One treatment: bare sections, `space-y-5` between them, with `border-t border-line/60 pt-5` for secondary groups |
| **Double padding** — text 20px in bare sections, 40px in cards | Pane `p-4 sm:p-5` plus card `px-5 py-4` | Cards removed; the pane is the only inset, so every left edge lines up |
| **A headless section** — output format had no heading and a stray `mt-4` at its top | The canvas was cut out of the middle of the old preview section, leaving the tail orphaned | Gave it a real heading (`outputTitle`) and a normal `mt-3` inner rhythm |

Also corrected across all six tools:

- **Pane rhythm was `space-y-4` / `space-y-5` / `space-y-6` at random** — now
  `space-y-5` everywhere, from the `panes` declaration.
- **Stage padding equalled rail padding** even though the stage holds the
  artifact. The `Pane` primitive now gives the stage `p-3 sm:p-4 lg:p-5` and
  the rails `p-4 sm:p-5`.
- **Autosave was a settings card** in the inspector rail. It is a preference,
  not a setting, so it moved to the action bar with undo/redo/save/open, which
  also shortened the rail.
- Card Studio's panel was `blocks → add → templates`; the frame/layout/digits
  group split out of the design section into the inspector as `shapeTitle`, so
  the panel is "what goes on the card" and the inspector is "how it comes out".

New strings, both locales: `cardStudio.shapeTitle`, `cardStudio.outputTitle`,
`adhkar.keepShareTitle`.


---

## 14. Horizontal spacing pass (the real bug)

The vertical pass fixed rhythm but missed the actual horizontal defect, which
was structural rather than cosmetic.

**17 internal grids still used VIEWPORT breakpoints.** They were tuned for the
old 860px column, and the pane split put them into a 264–360px rail without
changing a single one. At a 1440px viewport:

| Grid | Fired at | Landed in a ~300px rail |
| --- | --- | --- |
| `sm:grid-cols-3` (zakat gold, prayer method) | ≥640px viewport | 3 × 90px fields |
| `sm:grid-cols-4` (Card Studio templates) | ≥640px | 4 × 65px thumbnails |
| `sm:grid-cols-5` (prayer minute offsets) | ≥640px | 5 × 55px inputs |

**Fix:** every pane is now a `@container`, and internal grids use container
variants whose thresholds come from the real widths — rail 264–360px, stage
600–1900px, mobile/tablet pane 320–720px:

| Variant | Width | Use |
| --- | --- | --- |
| `@lg:` | 512px | split in two |
| `@2xl:` | 672px | three columns |
| `@3xl:` | 768px | four to five |

23 viewport variants converted across the six tools plus `ToolHeroStats` and
`ToolHeroBody`.

**Two overflow bugs found on the way:**

- `ToolHeroBody layout="split"` used `lg:grid-cols-[1fr_340px]`. `1fr` is
  `minmax(auto, 1fr)`, so it cannot shrink below the Qibla dial's 208px — at a
  1280px viewport the stage is ~440px, and 208 + 340 overflowed it. Now
  `@lg:grid-cols-[minmax(0,1fr)_clamp(180px,32%,320px)]`.
- Hijri's result grid `@lg:grid-cols-[1.45fr_0.85fr]` had the same defect: the
  `1.45fr` track held a 42px date and pushed the metadata card out. Caught by
  the new test, not by eye.

**Also:** rails widened to `clamp(264px, 22vw, 360px)` (inspector trimmed to
`clamp(240px, 18vw, 340px)` so the stage keeps the slack), and Card Studio's
segmented groups went from `gap-x-6` to `gap-x-4` — 24px between groups is a
lot to spend in a 300px rail.

**New guard** — `src/lib/panes.test.ts` fails the build if a viewport layout
variant reappears inside a tool or in `tool-hero`, and if a middle flexible
track loses its `minmax(0, …)`. This is the second bug the tests have caught
that markup review missed.
