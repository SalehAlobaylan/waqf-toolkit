# Waqf Toolkit logo

The six concepts this identity was drawn from, and where each one ended up.

**These PNGs are reference artwork, not production assets.** They are the
originals the mark was measured from. Nothing in `src/` or `public/` loads
them — the shipped logo is vector, generated from `src/components/logo.tsx`.

## What ships

| Asset | Source | Notes |
| --- | --- | --- |
| `src/components/logo.tsx` | — | The mark, as inline SVG. `MarkTile` for light surfaces, `MarkKnockout` for the green footer. |
| `public/favicon.svg` | `pnpm brand` | Generated. Colours baked — a favicon loads no stylesheet. |
| `public/favicon-{16,32}.png`, `apple-touch-icon.png`, `icon-{192,512}.png`, `icon-maskable-{192,512}.png` | `pnpm brand` | Generated. Maskable variants bleed the tile to the edge and pull the rosette into the 80% safe circle. |
| `public/site.webmanifest` | `pnpm brand` | Generated, so its `theme_color` cannot drift from the mark. |
| `public/og.png` | `pnpm brand` | 1200×630 social card, rendered with headless Chrome using the site's own woff2 files. |

Run `pnpm brand` after any change to the geometry. The script re-checks its
copy of the coordinates against `logo.tsx` and fails if they have drifted.

## The six concepts

| File | What it shows | Where the idea is used |
| --- | --- | --- |
| `logo-1-lockup-horizontal-light.png` | Forest tile + "Waqf", side by side | The social card's lockup, and the shape of the header: mark, then wordmark. |
| `logo-2-lockup-horizontal-reversed.png` | Cream tile + "Waqf" reversed out of solid forest | The footer's colour idea — the one solid brand block, mark reversed. |
| `logo-3-icon-tile.png` | Forest tile carrying the rosette | Favicon, PWA icons, apple-touch-icon, header mark. |
| `logo-4-mark-on-green.png` | Rosette alone on solid forest, no tile | The footer's knockout mark. No tile is what makes the cream centre dot read against the green — in concept 2 the cream dot on a cream tile all but disappears. |
| `logo-5-lockup-stacked.png` | Mark above "Waqf" | Considered for the footer, then dropped: the footer column is wide and short, so a stacked lockup would have forced either a very tall or a very small mark. |
| `logo-6-icon-tile-alt.png` | A second pass at the icon tile | Superseded by concept 3. Kept only because it is the variant the geometry was cross-checked against. |

## Two things the artwork could not be used for directly

**The wordmark is not in the logo.** Every concept bakes "Waqf" into the
pixels, but the site is bilingual — Arabic renders `وقف / صندوق الأدوات`.
Shipping an English raster wordmark in the Arabic header would break the
"one language at a time" rule in `AGENTS.md`. So the mark on its own is the
only part that ships as an image, and the wordmark stays as live, translated,
selectable HTML text next to it. A bonus: the header is real text, so it
reflows, scales and stays accessible for free.

**The backgrounds are opaque.** All six PNGs are RGB, not RGBA, and the "white"
is actually an off-white around `#fdfefa` — warm and slightly uneven, with a
faint tint that shifts between files. Dropped on the site's cream paper
(`--color-paper`, `#f6f2ea`) that reads as a visible off-white box with soft
edges. This is the reason the shipped logo is vector rather than these files
pasted into the page: it has real transparency and no baked background.

## Geometry

The rosette is eight arms at 45°. One arm is a three-segment bezier chain —
root, widest point, waist, then a tangent into the tip circle — unioned with
that tip circle, instanced eight times. Those control points were fitted to
the artwork in `logo-3` to within 0.03% of the tile width, then the eight arms
were made identical: in the original the four diagonal arms measure about 9%
thinner than the four axis arms, which reads as sloppiness at any size above a
favicon. A logo needs the geometry to be regular even when the source is not.

## Colour

Sampled from the artwork and pinned in `app.css` as `--color-brand-*`:

| Role | Hex | HSL |
| --- | --- | --- |
| Tile and rosette ground | `#10412d` | `hsl(154 60% 16%)` |
| Rosette arms | `#a8c968` | `hsl(79 47% 59%)` |
| Rosette centre | `#fdfdf9` | `hsl(48 52% 97%)` |

These are deliberately **not** the interface palette. `--color-forest`
(`#234436`) and `--color-olive` (`#c5d58b`) are a less saturated, lighter pair
used for UI surfaces; the brand pair is deeper and richer. They are kept
separate so a contrast pass over the interface can never quietly recolour the
logo. If the mark is ever redesigned, change the tokens, `src/lib/brand.ts`
and this script together.
