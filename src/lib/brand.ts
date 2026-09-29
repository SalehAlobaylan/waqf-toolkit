/**
 * Brand colours, as hex.
 *
 * These mirror the `--color-brand-*` tokens in `src/styles/app.css` and the
 * values baked into `public/favicon.svg` and the icons in `public/`. They are
 * duplicated here because the places that need them — `<meta name="theme-color">`,
 * the web app manifest — run outside CSS.
 *
 * If you change the palette, change all three: the tokens, this map, and
 * `scripts/build-brand-assets.mjs`.
 */
export const BRAND = {
  /** Tile + rosette ground. */
  forest: '#10412d',
  /** Rosette arms. */
  olive: '#a8c968',
  /** Rosette centre. */
  cream: '#fdfdf9',
  /** Site paper, for browser-chrome surfaces that are not the logo. */
  paper: '#f6f2ea',
} as const
