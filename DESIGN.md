# Design — Liquid Glass ("Frosted Orchard")

The visual identity of Waqf Toolkit: warm parchment surfaces floating as
liquid glass over an orchard of soft olive/clay light. This document is the
reference for extending or tuning the system. Implementation lives in
`src/styles/app.css`; this file explains the intent and the rules.

## Principles

1. **Glass needs something to refract.** Translucent surfaces are invisible
   over flat paper. Every page sits on a fixed "stage" of ambient color so
   frosted surfaces always have vivid material behind them.
2. **Text never goes glass.** All type is solid ink on translucent
   surfaces. Only *surfaces* are translucent; contrast stays WCAG-safe.
3. **Hierarchy through opacity, not blur alone.** Primary actions stay
   solid (olive/clay fills). Glass is for containers and secondary
   controls, so what's solid reads as clickable.
4. **Honest materials.** No neon glows, no dark-mode glass, no effects that
   fake depth the layout doesn't have. The palette stays paper / olive /
   clay, derived from theme tokens.

## The stage (`src/routes/$locale/route.tsx`)

A fixed, `pointer-events-none`, `z-0` layer rendered once per locale page:

- `.bg-ambient` — three large radial washes: olive top-start,
  clay mid-end, sage settling toward the footer.
- Three blurred color blobs (`.animate-blob` + `blur-[110px]`), drifting
  on a 26s transform-only loop with staggered negative delays:
  - olive `/30` — top-start
  - clay `/22` — mid-end
  - accent `/15` — low-center

Content (`<main>`, `<footer>`) stacks above at `relative z-10`. Because the
layer is fixed, every scroll position keeps color behind the glass.

## Glass recipes (`src/styles/app.css`)

| Class | Fill | Blur | Use for |
|---|---|---|---|
| `.glass-card` | surface @ 52% | 22px + saturate(1.5) | cards, fields, pills, bars |
| `.glass-panel` | paper @ 66% | 28px + saturate(1.45) | menus, hero panels, popovers |

Each recipe layers four optical cues:

1. **Bright top rim** — `inset 0 1.5px 0 white/70–85` (light catching the edge).
2. **Dark underbelly** — faint inset shadow at the bottom (thickness).
3. **Deep outer shadow** — soft lift off the stage.
4. **Specular ring** — `::before` conic-gradient masked to a 1.5px ring
   (`mask-composite: exclude`), so light appears to bend around the edge.
   Replaces flat borders visually; keep a faint real border as fallback.

### Pointer sheen

`.glass-card::after` renders a radial highlight at `--sheen-x/--sheen-y`.
Attach the `useSheen()` handler (`src/lib/use-sheen.ts`) via
`onPointerMove` to surfaces that should feel interactive (tool cards, hero
search pill, contribute form). rAF-throttled; one style write per frame.

### Hero refraction lens

`.lens` adds an SVG displacement filter (`#liquid-lens`, defined inline in
`src/routes/$locale/index.tsx`) to `backdrop-filter`, bending the backdrop
behind the hero card. Chromium applies it; browsers that reject `url()`
drop the whole declaration and keep the standard `.glass-panel` look.
Use on at most one element per page.

## Usage rules

- **Compose, don't restyle.** Use `.glass-card` / `.glass-panel` as-is;
  add only radius, padding, and border tint at the call site. Don't
  override fill alpha per component.
- **Where glass goes:** cards, dropdowns, mobile menu, search fields,
  form panels, section intro bars, secondary buttons (`variant="outline"`),
  large floating category tiles.
- **Where glass does NOT go:** primary buttons (solid accent), the forest
  privacy band and its InfoCards, text itself, nested boxes inside an
  already-glass parent (GPU cost without visual gain).
- **Dark variant exception:** `InfoCard dark` renders solid
  `bg-forest-accent/45` — glass recipes are light-surface only.

## Guardrails

- `@supports not (backdrop-filter)` → opaque `surface` fill, specular
  rings hidden. Never rely on translucency for meaning.
- `prefers-reduced-motion` → blob drift, sheen, and all animation stop
  (global rule in `app.css`).
- Performance budget: one fixed stage + three blobs per page; heavy blur
  only on first-level surfaces. If adding a glass surface inside another
  glass surface, use a solid tint instead.

## Tool surfaces (`app` vs `document`)

Every tool page is one of exactly two templates. The catalog says what a tool
*is*; `src/lib/panes.ts` (`TOOL_LAYOUTS`) says what shape its interface takes.

| | `app` | `document` |
|---|---|---|
| Used by | all six runnable tools | informational / archived entries |
| Width | fluid — the whole viewport, or `--shell-w` | `--measure` prose column |
| Height | `calc(100dvh - var(--header-h-app))` | auto, window scrolls |
| Header | contextual, 56px, carries the `h1` | full nav, 72px |
| Footer | suppressed | rendered |
| Arrangement | 1 / 2 / 3 panes | one column |
| Scroll owner | each pane at `lg`+ | the window |

**The app template removes dead zone rather than adding chrome.** There is no
identity block above the workspace — no icon tile, no large heading, no "open
the tool" button pointing at the page you are already on, no panel title bar.
Together those cost ~326px of vertical dead zone before the first line of tool
UI, plus ~580px of horizontal margin at 1440px.

Rules that keep it honest:

- **Shell owns space, tool owns arrangement.** The shell provides width,
  height and scroll ownership; a tool decides what its regions are. Before
  this split the shell owned arrangement implicitly, by refusing the tool any
  horizontal room.
- **A tool renders its own `<Workspace>`.** The action bar's handlers (undo,
  save, open) live inside the tool, so a route-level wrapper cannot host it.
- **`panes` is both the DOM order and the grid order.** `workspaceGridClasses`
  derives the template from the array; if the two disagree the wide `stage`
  track lands on the wrong pane with no error. `data/tools.test.ts` asserts it.
- **Grid templates are literals in `WORKSPACE_GRID`.** Tailwind extracts class
  names by scanning source text, so a template literal like
  `` `lg:grid-cols-[${tracks}]` `` emits no CSS at all.
- **The artifact pane declares itself with `fill`.** Not implied by the pane
  id: Card Studio's canvas is a side rail, not the stage, and the picker is the
  stage. `fill` means "this cell is the artifact — it fits, it does not scroll".
- **`wide` and `defer` are per-tool facts, not defaults.** Card Studio keeps
  the slack on the picker and defers the *assembly* rail at `lg`, because a
  preview you cannot see is worse than frame controls you must scroll to. A
  new layout must add its `WORKSPACE_GRID` literal or it silently renders one
  column; `components/ui.test.ts` fails the build when a declared layout has no
  entry.
- **Text-first tools put the chooser in the middle.** Card Studio: assembly
  rail, picker, canvas rail. A 1080×1920 story card is unjudgeable at 440px, so
  the canvas opens in a native `<dialog>` at full size rather than shrinking
  the chooser to compensate.
- **Search must fold the script it searches.** The corpus is vocalised
  Uthmani Arabic, so an unvocalised query matches nothing unless tashkeel and
  the alef/ya/ta-marbuta families are folded first — see
  `card-studio/engine/search.ts`. Sacred text is never modified; folding is
  only ever used to decide which rows to show.
- **A long picker is a disclosure, not a section.** Card Studio's 23 template
  thumbnails are ~1340px tall in a rail — more than a whole viewport — and the
  dataset list is long and rarely read. Both are `<details>` that start closed,
  and the template summary names the current selection so closing it never
  hides which one is applied.
- **Order a rail by the flow, and keep the space hog last.** Card Studio's
  panel runs add → chosen blocks → template. The picker is the only way to get
  content in, so it leads; the block list follows the action that fills it
  (and `MAX_BLOCKS` is 3, so it is tiny); templates are a refinement you reach
  for once the words are right. Leading with the smallest section and burying
  the primary action at the bottom is the ordering bug to avoid.
- **Inside a pane, respond to the container, not the viewport.** Each pane is
  a `@container`. A viewport breakpoint cannot tell a 300px rail from a 900px
  stage, so `sm:grid-cols-3` used to fire on the *viewport* and land three
  columns in a rail: 90px form fields, 65px template thumbnails. Internal
  grids use `@lg:` / `@2xl:` / `@3xl:` (512 / 672 / 768px). Thresholds come
  from the real container widths — rail 264–360px, stage 600–1900px.
  `src/lib/panes.test.ts` fails the build if a viewport variant creeps back in
  (and covers `tool-hero`, which also renders inside a pane).
- **A flexible grid track is `minmax(0, 1fr)`, never `1fr`.** `1fr` is
  `minmax(auto, 1fr)`: it cannot shrink below its content, so a fixed sibling
  column pushes the layout out of the pane. Same test guards it.
- **The inspector waits for `xl`.** At `lg`, two 248px panes already leave the
  stage barely 500px wide.
- **Workspace panes are solid, never glass.** `DESIGN.md`'s budget above caps
  heavy blur at first-level surfaces, and `.glass-panel::before` is
  `inset: 0` — at viewport size its conic ring becomes a viewport-wide sweep
  on every repaint. Panes use `--surface-pane` with `--color-line` borders;
  glass stays on the small floating things.
- **The workspace is a bounded box, never a locked body.** `height` on the
  grid, per-pane `overflow-y: auto`, and the page keeps scrolling — the Adhkar
  booklet and the Card Studio sheet depend on normal document flow to print.
  `@media print` releases the bounds as a backstop.
- **Logical properties only inside a workspace.** `grid-cols-*` is physical, so
  the first pane lands on the right under `dir="rtl"` — the start side, which
  is correct. Use `ps-`/`pe-`/`ms-`/`me-`/`border-e`/`border-s`; never `left-`
  or `right-`.
- **The `processingNote` is never collapsed.** It lives in `StatusStrip`,
  because AGENTS.md requires every tool page to state where processing
  happens. The long-form record sits in the `ToolAbout` disclosure below.

## Tuning knobs

All in `src/styles/app.css` unless noted:

| Knob | Where | Current |
|---|---|---|
| Wash intensity | `.bg-ambient` alphas | 0.32 / 0.18 / 0.6 |
| Blob intensity | `route.tsx` bg-*/NN | 30 / 22 / 15 |
| See-through amount | glass fills | 0.52 / 0.66 |
| Blur strength | glass blur radii | 22px / 28px |
| Saturation lift | saturate() | 1.5 / 1.5-ish |
| Rim brightness | inset white alpha | 0.7 / 0.75 |
| Sheen strength | `.glass-card::after` alpha | 0.16 |
| Refraction amount | `scale` on feDisplacementMap | 30 |

Raise fills toward 0.7+ to calm the effect; lower toward 0.4 and raise
blob alphas to make it louder.
