/**
 * Regenerates the brand assets in `public/` from the rosette geometry in
 * `src/components/logo.tsx`.
 *
 *   pnpm brand
 *
 * Everything here is a one-off build step: the outputs are committed, so CI
 * never needs this script. It shells out to `sips` (macOS) to rasterise SVG and
 * to headless Chrome for the social card, which is why it refuses to run
 * anywhere else instead of half-working.
 *
 * The geometry below is duplicated from logo.tsx on purpose — this runs in
 * plain Node and cannot import a .tsx module. Every run re-checks the two
 * against each other and fails loudly if they have drifted.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')

/** Must stay in step with src/components/logo.tsx */
const GEO = {
  ARM_PATH:
    'M0 -1.93 C9.23 -2 10.2 -4.64 14.05 -4.64 C17.9 -4.64 20.02 -2.18 22.9 -2.18 ' +
    'C23.8 -2.18 25.57 -2.6 26.9 -4.3 L26.9 4.3 C25.57 2.6 23.8 2.18 22.9 2.18 ' +
    'C17.9 4.64 20.02 2.18 14.05 4.64 C10.2 4.64 9.23 2 0 1.93 Z',
  TIP_CX: 33.58,
  TIP_R: 8.06,
  DOT_R: 11.18,
  TILE_R: 22.5,
  ANGLES: [0, 45, 90, 135, 180, 225, 270, 315],
}

/** Baked from the --color-brand-* tokens in app.css. */
const BRAND = {
  forest: '#10412d',
  olive: '#a8c968',
  cream: '#fdfdf9',
  paper: '#f6f2ea',
}

/**
 * @param size     pixel size of the output
 * @param tile     background colour painted edge to edge, or omitted for a
 *                 bare rosette
 * @param tileR    corner radius of the tile
 * @param artScale scales the rosette about the centre. Maskable icons use this
 *                 to pull the artwork inside the 80% safe circle while the
 *                 tile stays full bleed, so any mask crops flat brand colour.
 */
function markSvg({ size, tile, dot = BRAND.cream, arms = BRAND.olive, tileR = GEO.TILE_R, artScale = 1, sized = true }) {
  const s = Math.round(artScale * 1000) / 1000
  const R = Math.round(tileR * 1000) / 1000
  const dims = sized ? ` width="${size}" height="${size}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${dims}>
<defs><g id="arm"><circle cx="${GEO.TIP_CX}" r="${GEO.TIP_R}"/><path d="${GEO.ARM_PATH}"/></g></defs>
${tile ? `<rect width="100" height="100" rx="${R}" fill="${tile}"/>` : ''}
<g transform="translate(50 50) scale(${s}) translate(-50 -50)">
<g fill="${arms}" transform="translate(50 50)">${GEO.ANGLES.map((a) => `<use href="#arm" transform="rotate(${a})"/>`).join('')}</g>
<circle cx="50" cy="50" r="${GEO.DOT_R}" fill="${dot}"/>
</g>
</svg>`
}

function rasterise(svg, outFile, size) {
  const tmp = mkdtempSync(join(tmpdir(), 'waqf-brand-'))
  try {
    const svgFile = join(tmp, 'in.svg')
    writeFileSync(svgFile, svg)
    execFileSync('sips', ['-s', 'format', 'png', svgFile, '--out', outFile], {
      stdio: 'ignore',
    })
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
  console.log(`  ${outFile.replace(ROOT + '/', '')}  ${size}x${size}`)
}

/** Android/iOS round-icon friendly square. */
const TILE = { tile: BRAND.forest }

const TARGETS = [
  // name,                  size,  options
  ['favicon-16.png', 16, TILE],
  ['favicon-32.png', 32, TILE],
  ['apple-touch-icon.png', 180, TILE],
  ['icon-192.png', 192, TILE],
  ['icon-512.png', 512, TILE],
  // Maskable: tile bleeds to the edge, rosette pulled into the 80% safe circle
  // (the rosette's own radius is 41.6/50 of the canvas, so 0.8 sits well
  // inside it) and the tile corners squared off for circular masks.
  ['icon-maskable-192.png', 192, { tile: BRAND.forest, tileR: 0, artScale: 0.8 }],
  ['icon-maskable-512.png', 512, { tile: BRAND.forest, tileR: 0, artScale: 0.8 }],
]

if (process.platform !== 'darwin') {
  console.error('pnpm brand needs macOS `sips` to rasterise SVG. Skipping.')
  process.exit(0)
}

// Cross-check the duplicated geometry so silent drift is impossible.
const logoSrc = readFileSync(join(ROOT, 'src/components/logo.tsx'), 'utf8')
const checks = [
  ...GEO.ARM_PATH.split(/[\s,]+/)
    .filter((t) => t && t !== 'M' && t !== 'C' && t !== 'L' && t !== 'Z')
    .map((t) => ['ARM_PATH ' + t, t]),
  ['TIP_CX', `const TIP_CX = ${GEO.TIP_CX}`],
  ['TIP_R', `const TIP_R = ${GEO.TIP_R}`],
  ['DOT_R', `const DOT_R = ${GEO.DOT_R}`],
  ['TILE_R', `const TILE_R = ${GEO.TILE_R}`],
  ['ARM_ANGLES', `const ARM_ANGLES = [${GEO.ANGLES.join(', ')}]`],
]
const missing = checks.filter(([, needle]) => !logoSrc.includes(needle))
if (missing.length > 0) {
  console.error('geometry drift between logo.tsx and this script:')
  for (const [label] of missing) console.error('  ' + label)
  process.exit(1)
}

console.log('brand assets ->')

// The SVG favicon comes out of the same generator, so it cannot drift from the
// rasters. Colours are baked: a favicon is loaded with no stylesheet.
writeFileSync(join(PUBLIC, 'favicon.svg'), markSvg({ tile: BRAND.forest, sized: false }))
console.log('  public/favicon.svg')

for (const [name, size, opts] of TARGETS) {
  rasterise(markSvg({ size, ...opts }), join(PUBLIC, name), size)
}

// The manifest is generated so its theme colour can never drift from the mark.
// Its copy is plain English; the UI is bilingual but an installed-app label is
// a single name, and "Waqf Toolkit" is the product name in both locales.
const manifest = {
  name: 'Waqf Toolkit',
  short_name: 'Waqf',
  description:
    'Free, open-source web tools you can use instantly in your browser. Nothing to install, honest about your data.',
  id: '/',
  start_url: '/en',
  scope: '/',
  display: 'standalone',
  orientation: 'any',
  background_color: BRAND.paper,
  theme_color: BRAND.forest,
  lang: 'en',
  dir: 'auto',
  icons: [
    { src: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
}
writeFileSync(join(PUBLIC, 'site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n')
console.log('  public/site.webmanifest')

// --- social card -----------------------------------------------------------
// Rendered with headless Chrome rather than hand-plotted into a canvas so the
// card uses the same woff2 files the site ships. Needs Chrome; skipped if it
// is not installed, since the committed PNG stays valid either way.
const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p))

if (!CHROME) {
  console.log('  public/og.png (skipped — no Chrome found)')
  console.log('done.')
  process.exit(0)
}

const ogHtml = `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face{font-family:'Bricolage';src:url('${join(PUBLIC, 'fonts/bricolage-grotesque-700-latin.woff2')}');font-weight:700}
@font-face{font-family:'Bricolage';src:url('${join(PUBLIC, 'fonts/bricolage-grotesque-600-latin.woff2')}');font-weight:600}
@font-face{font-family:'DM Sans';src:url('${join(PUBLIC, 'fonts/dm-sans-400-latin.woff2')}')}
@font-face{font-family:'Space Mono';src:url('${join(PUBLIC, 'fonts/space-mono-400-latin.woff2')}')}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f9f7f2;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.card{position:absolute;inset:24px;border-radius:28px;background:#faf9f6;border:1px solid #e6e2d7;padding:112px 76px 80px;display:flex;flex-direction:column}
.lockup{display:flex;align-items:center;gap:22px}
.name{font-family:'Bricolage',sans-serif;font-weight:700;font-size:56px;letter-spacing:-0.03em;color:#23312b;line-height:1}
h1{font-family:'Bricolage',sans-serif;font-weight:600;font-size:44px;letter-spacing:-0.025em;color:#23312b;margin-top:64px;line-height:1.1}
.sub{font-size:26px;color:#60766e;margin-top:18px;line-height:1.4}
.url{font-family:'Space Mono',monospace;font-size:21px;color:#2f654f;margin-top:auto}
</style></head><body>
<div class="card">
  <div class="lockup">
    ${markSvg({ size: 88, tile: BRAND.forest }).replace('<svg ', '<svg style="flex:none" ')}
    <span class="name">Waqf Toolkit</span>
  </div>
  <h1>Open tools with a clear job</h1>
  <p class="sub">Free and open-source. Local-first. Honestly labelled.</p>
  <div class="url">github.com/SalehAlobaylan/waqf-toolkit</div>
</div>
</body></html>`

const ogTmp = mkdtempSync(join(tmpdir(), 'waqf-og-'))
try {
  const htmlFile = join(ogTmp, 'og.html')
  writeFileSync(htmlFile, ogHtml)
  execFileSync(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      `--screenshot=${join(PUBLIC, 'og.png')}`,
      `file://${htmlFile}`,
    ],
    { stdio: 'ignore' },
  )
} finally {
  rmSync(ogTmp, { recursive: true, force: true })
}
console.log('  public/og.png')

console.log('done.')
