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
