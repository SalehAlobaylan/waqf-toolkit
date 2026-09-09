import {
  FORMAT_MIME,
  FORMAT_QUALITY,
  IMAGE_FRAMES,
  IMAGE_SCALES,
  arabicFont,
  fallbackPalette,
  layoutSingleCard,
  pickFormat,
  singleCardGeometry,
  titleFont,
  type ImageFormat,
  type ImageFrame,
  type ImageMood,
  type ImageResolution,
} from './card-image'

export type RenderSingleOpts = {
  frame: ImageFrame
  mood: ImageMood
  resolution: ImageResolution
  format: ImageFormat
  /** Set name in the card's single language. */
  eyebrow: string
  eyebrowRtl: boolean
  titleLine: string
  arabic: string
}

export type RenderedImage = { blob: Blob; actualFormat: ImageFormat }

export function hasArabic(str: string): boolean {
  return /[؀-ۿ]/.test(str)
}

function themeColor(varName: string, fallback: string): string {
  try {
    if (typeof getComputedStyle !== 'function' || typeof CSS === 'undefined') return fallback
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    if (raw !== '' && CSS.supports('color', raw)) return raw
  } catch {
    // ignore — fall back to pinned hex
  }
  return fallback
}

function livePalette(mood: ImageMood) {
  const fb = fallbackPalette(mood)
  if (mood === 'forest') {
    return {
      ...fb,
      bg: themeColor('--color-forest', fb.bg),
      frameOuter: themeColor('--color-olive', fb.frameOuter),
      frameInner: themeColor('--color-olive', fb.frameInner),
      eyebrow: themeColor('--color-olive', fb.eyebrow),
      ornament: themeColor('--color-olive', fb.ornament),
      pillBg: themeColor('--color-olive', fb.pillBg),
    }
  }
  return {
    ...fb,
    bg: themeColor('--color-paper', fb.bg),
    frameOuter: themeColor('--color-accent-strong', fb.frameOuter),
    frameInner: themeColor('--color-accent-strong', fb.frameInner),
  }
}

/**
 * Letterspacing disconnects Arabic cursive joining in canvas renderers.
 * Track latin micro-labels only; Arabic runs always pass '0px'.
 */
function tracked(ctx: CanvasRenderingContext2D, value: string, str: string) {
  try {
    ;(ctx as unknown as Record<string, unknown>).letterSpacing =
      value !== '0px' && hasArabic(str) ? '0px' : value
  } catch {
    // older canvas — plain spacing is fine
  }
}

function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  font: string,
  color: string,
  opts?: { align?: CanvasTextAlign; dir?: CanvasDirection },
) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = opts?.align ?? 'center'
  ctx.textBaseline = 'alphabetic'
  try {
    ctx.direction = opts?.dir ?? 'inherit'
  } catch {
    // ignore
  }
  ctx.fillText(str, x, y)
}

const FONT_TIMEOUT_MS = 3000

async function ensureFonts() {
  try {
    if (typeof document === 'undefined' || !('fonts' in document)) return
    const loads = [
      '500 68px "Thmanyah Display"',
      '700 44px "Thmanyah Display"',
      '700 34px "Thmanyah Sans"',
      '400 38px "DM Sans"',
      '700 34px "Space Mono"',
      '800 40px "Bricolage Grotesque"',
    ].map((f) => document.fonts.load(f).catch(() => []))
    await Promise.race([
      Promise.all(loads),
      new Promise((resolve) => window.setTimeout(resolve, FONT_TIMEOUT_MS)),
    ])
  } catch {
    // fall back to system fonts
  }
}

function baseCanvas(frame: ImageFrame, mood: ImageMood, resolution: ImageResolution) {
  const scale = IMAGE_SCALES[resolution]
  const { w, h } = IMAGE_FRAMES[frame]
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('render-failed')
  ctx.scale(scale, scale)
  const pal = livePalette(mood)

  // Ground
  ctx.fillStyle = pal.bg
  ctx.fillRect(0, 0, w, h)

  // Top glow
  const glow = ctx.createRadialGradient(w / 2, -h * 0.2, 10, w / 2, -h * 0.2, h * 0.9)
  glow.addColorStop(0, pal.glow)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.globalAlpha = mood === 'forest' ? 0.5 : 0.7
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Bottom vignette — footer legibility over the lattice
  const shade = ctx.createLinearGradient(0, h * 0.68, 0, h)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, mood === 'forest' ? 'rgba(0,0,0,0.28)' : 'rgba(60,40,20,0.10)')
  ctx.save()
  ctx.fillStyle = shade
  ctx.fillRect(0, h * 0.68, w, h * 0.32)
  ctx.restore()

  // Lattice: eight-point stars (rotated squares) + dots, clipped inside frame
  ctx.save()
  ctx.beginPath()
  ctx.rect(48, 48, w - 96, h - 96)
  ctx.clip()
  ctx.strokeStyle = pal.lattice
  ctx.fillStyle = pal.lattice
  const step = 190
  for (let gy = 120; gy < h; gy += step) {
    for (let gx = 90; gx < w; gx += step) {
      const ox = ((gy / step) % 2) * step * 0.5
      ctx.save()
      ctx.globalAlpha = 0.045
      ctx.translate(gx + ox, gy)
      ctx.rotate(Math.PI / 4)
      ctx.lineWidth = 2
      const s = 24
      ctx.strokeRect(-s / 2, -s / 2, s, s)
      ctx.restore()
      ctx.save()
      ctx.globalAlpha = 0.04
      ctx.beginPath()
      ctx.arc(gx + ox + step / 2, gy + step / 2, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
  ctx.restore()

  // Double frame
  ctx.strokeStyle = pal.frameOuter
  ctx.lineWidth = 5
  ctx.strokeRect(44, 44, w - 88, h - 88)
  ctx.save()
  ctx.globalAlpha = 0.65
  ctx.strokeStyle = pal.frameInner
  ctx.lineWidth = 2
  ctx.strokeRect(64, 64, w - 128, h - 128)
  ctx.restore()

  return { canvas, ctx, pal, w, h }
}

function drawEyebrow(
  ctx: CanvasRenderingContext2D,
  pal: ReturnType<typeof livePalette>,
  w: number,
  y: number,
  str: string,
  rtl: boolean,
) {
  if (rtl) {
    text(ctx, str, w / 2, y, '700 36px "Thmanyah Sans", serif', pal.eyebrow, { dir: 'rtl' })
    return
  }
  tracked(ctx, '6px', str)
  text(ctx, str.toUpperCase(), w / 2, y, '700 28px "Space Mono", monospace', pal.eyebrow, {
    dir: 'ltr',
  })
  tracked(ctx, '0px', '')
}

function drawOrnament(
  ctx: CanvasRenderingContext2D,
  pal: ReturnType<typeof livePalette>,
  w: number,
  y: number,
) {
  const cx = w / 2
  ctx.save()
  ctx.strokeStyle = pal.ornament
  ctx.fillStyle = pal.ornament
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.moveTo(cx - 170, y)
  ctx.lineTo(cx - 34, y)
  ctx.moveTo(cx + 34, y)
  ctx.lineTo(cx + 170, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, y - 13)
  ctx.lineTo(cx + 13, y)
  ctx.lineTo(cx, y + 13)
  ctx.lineTo(cx - 13, y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function toBlob(canvas: HTMLCanvasElement, format: ImageFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('render-failed'))
      },
      FORMAT_MIME[format],
      FORMAT_QUALITY[format],
    )
  })
}

/** Runtime encoder support, with result caching. PNG is always available. */
const supportCache = new Map<ImageFormat, boolean>()

export function supportedFormats(): ImageFormat[] {
  const out: ImageFormat[] = ['png']
  if (typeof document === 'undefined') return out
  for (const f of ['jpeg', 'webp'] as const) {
    let ok = supportCache.get(f)
    if (ok === undefined) {
      try {
        const c = document.createElement('canvas')
        c.width = 1
        c.height = 1
        ok = c.toDataURL(FORMAT_MIME[f]).startsWith(`data:${FORMAT_MIME[f]}`)
      } catch {
        ok = false
      }
      supportCache.set(f, ok)
    }
    if (ok) out.push(f)
  }
  return out
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function renderSingleCard(opts: RenderSingleOpts): Promise<RenderedImage> {
  await ensureFonts()
  const geo = singleCardGeometry(opts.frame)
  const { canvas, ctx, pal, w } = baseCanvas(opts.frame, opts.mood, opts.resolution)
  const measure = (t: string, f: string) => {
    ctx.font = f
    return ctx.measureText(t).width
  }
  const layout = layoutSingleCard(measure, {
    frame: opts.frame,
    arabic: opts.arabic,
    titleLine: opts.titleLine,
  })
  // Sacred text is never clipped: refuse rather than export a cut verse.
  if (!layout.fits) throw new Error('layout-overflow')

  drawEyebrow(ctx, pal, w, geo.eyebrowY, opts.eyebrow, opts.eyebrowRtl)
  drawOrnament(ctx, pal, w, geo.ornamentY)
  layout.titleLines.forEach((line, i) => {
    text(ctx, line, w / 2, geo.titleY + i * layout.titleSize * 1.5, titleFont(layout.titleSize), pal.title, {
      dir: 'inherit',
    })
  })

  layout.arabicLines.forEach((line, i) => {
    text(ctx, line, w / 2, geo.arabicTop + i * layout.arabicSize * geo.arabicLineHeight, arabicFont(layout.arabicSize), pal.arabic, {
      dir: 'rtl',
    })
  })
  const actualFormat = pickFormat(opts.format, supportedFormats())
  return { blob: await toBlob(canvas, actualFormat), actualFormat }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }
}
