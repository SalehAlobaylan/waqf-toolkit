# Waqf Toolkit icon assets (superseded)

> **These are the pre-rosette icon and are no longer the site's icon.** They are
> exports of the previous favicon — a rounded tile with a simple eight-point
> starburst. The current mark is the eight-point rosette described in
> [`../logos/README.md`](../logos/README.md), and nothing references this
> folder. Kept only as a record of the previous identity.
>
> For current icons, run `pnpm brand`. It writes `public/favicon.svg`,
> `public/favicon-{16,32}.png`, `public/apple-touch-icon.png`,
> `public/icon-{192,512}.png` and `public/icon-maskable-{192,512}.png` from the
> geometry in `src/components/logo.tsx`.

The file list below describes the old set.

| File pattern | Format | Sizes | Background |
| --- | --- | --- | --- |
| `waqf-toolkit-icon.svg` | SVG master | Scalable | Transparent |
| `waqf-toolkit-icon-{2048,1024,512,256,128,64,32}.png` | PNG | 2048px through 32px | Transparent |
| `waqf-toolkit-icon-{2048,1024,512}.webp` | Lossless WebP | 2048px through 512px | Transparent |
| `waqf-toolkit-icon-2048.jpg` | JPEG | 2048px | White corners; JPEG does not support transparency |

Use the SVG whenever the consuming tool supports it. Use the PNG or lossless WebP exports when a raster image is required.
