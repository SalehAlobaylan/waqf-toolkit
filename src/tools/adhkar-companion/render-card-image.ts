import {
  FORMAT_MIME,
  FORMAT_QUALITY,
  IMAGE_FRAMES,
  IMAGE_SCALES,
  arabicFont,
  fallbackPalette,
  layoutSingleCard,
  meaningFont,
  microFont,
  pickFormat,
  planSummaryRows,
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
  eyebrowAr: string
  eyebrowEn: string
  titleLine: string
  arabic: string
  countLabel: string
  meaning: string
  sourceLine: string
  wordmark: string
  warn1: string
  warn2: string
}

export type SummaryRow = { title: string; done: boolean }

export type RenderSummaryOpts = {
  frame: ImageFrame
  mood: ImageMood
  resolution: ImageResolution
  format: ImageFormat
  eyebrowAr: string
  eyebrowEn: string
  titleLine: string
  dateLine: string
  ringLabel: string
  ringSub: string
  rows: SummaryRow[]
  moreTemplate: string
  wordmark: string
  warn1: string
  warn2: string
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

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
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
  arY: number,
  enY: number,
  ar: string,
  en: string,
) {
  text(ctx, ar, w / 2, arY, '700 34px "Thmanyah Sans", serif', pal.eyebrow, { dir: 'rtl' })
  tracked(ctx, '6px', en)
  text(ctx, en.toUpperCase(), w / 2, enY, '700 26px "Space Mono", monospace', pal.eyebrow, {
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

function drawFooter(
  ctx: CanvasRenderingContext2D,
  pal: ReturnType<typeof livePalette>,
  w: number,
  wordmarkY: number,
  warnY: number,
  warn2Y: number,
  wordmark: string,
  warn1: string,
  warn2: string,
) {
  tracked(ctx, '4px', wordmark)
  text(ctx, wordmark.toUpperCase(), w / 2, wordmarkY, '800 34px "Bricolage Grotesque", sans-serif', pal.eyebrow, {
    dir: 'ltr',
  })
  tracked(ctx, '0px', '')
  text(ctx, warn1, w / 2, warnY, '400 27px "DM Sans", "Thmanyah Sans", sans-serif', pal.micro, {
    dir: 'inherit',
  })
  text(ctx, warn2, w / 2, warn2Y, '400 27px "DM Sans", "Thmanyah Sans", sans-serif', pal.micro, {
    dir: 'inherit',
  })
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
    meaning: opts.meaning,
    titleLine: opts.titleLine,
  })
  // Sacred text is never clipped: refuse rather than export a cut verse.
  if (!layout.fits) throw new Error('layout-overflow')

  drawEyebrow(ctx, pal, w, geo.eyebrowArY, geo.eyebrowEnY, opts.eyebrowAr, opts.eyebrowEn)
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
  const arabicBottom =
    geo.arabicTop + (layout.arabicLines.length - 1) * layout.arabicSize * geo.arabicLineHeight

  // Count pill
  const pillFont = microFont(42)
  const pillW = measure(opts.countLabel, pillFont) + 110
  const pillY = arabicBottom + geo.pillGap
  ctx.save()
  ctx.fillStyle = pal.pillBg
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  rr(ctx, w / 2 - pillW / 2, pillY, pillW, geo.pillH, geo.pillH / 2)
  ctx.fill()
  ctx.restore()
  text(ctx, opts.countLabel, w / 2, pillY + geo.pillH / 2 + 15, pillFont, pal.pillText, { dir: 'ltr' })

  // Meaning (pre-truncated with ellipsis by layout; empty for bare custom items)
  if (layout.meaningLines.length > 0) {
    const top = pillY + geo.pillH + geo.meaningGap
    layout.meaningLines.forEach((line, i) => {
      text(ctx, line, w / 2, top + i * layout.meaningSize * 1.6, meaningFont(layout.meaningSize), pal.meaning, {
        dir: 'inherit',
      })
    })
  }

  text(ctx, opts.sourceLine, w / 2, geo.sourceY, microFont(29), pal.micro, { dir: 'ltr' })
  drawFooter(ctx, pal, w, geo.footerWordmarkY, geo.footerWarnY, geo.footerWarn2Y, opts.wordmark, opts.warn1, opts.warn2)
  const actualFormat = pickFormat(opts.format, supportedFormats())
  return { blob: await toBlob(canvas, actualFormat), actualFormat }
}

export async function renderSummaryCard(opts: RenderSummaryOpts): Promise<RenderedImage> {
  await ensureFonts()
  const { w, h } = IMAGE_FRAMES[opts.frame]
  const { canvas, ctx, pal } = baseCanvas(opts.frame, opts.mood, opts.resolution)

  drawEyebrow(ctx, pal, w, opts.frame === 'square' ? 112 : 148, opts.frame === 'square' ? 150 : 190, opts.eyebrowAr, opts.eyebrowEn)
  drawOrnament(ctx, pal, w, opts.frame === 'square' ? 198 : 244)
  text(ctx, opts.titleLine, w / 2, opts.frame === 'square' ? 248 : 300, '700 48px "Thmanyah Display", serif', pal.title, {
    dir: 'inherit',
  })
  text(ctx, opts.dateLine, w / 2, opts.frame === 'square' ? 288 : 344, '400 30px "Space Mono", monospace', pal.micro, {
    dir: 'ltr',
  })

  // Progress ring
  const ringCY = opts.frame === 'square' ? 408 : 480
  const ringR = opts.frame === 'square' ? 78 : 88
  ctx.save()
  ctx.lineWidth = 20
  ctx.lineCap = 'round'
  ctx.strokeStyle = pal.ringTrack
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.arc(w / 2, ringCY, ringR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  const [doneStr, totalStr] = opts.ringLabel.split('/')
  const done = Number(doneStr ?? '0')
  const total = Number(totalStr ?? '1')
  const frac = total > 0 ? Math.min(1, done / total) : 0
  ctx.save()
  ctx.lineWidth = 20
  ctx.lineCap = 'round'
  ctx.strokeStyle = pal.ringFill
  ctx.shadowColor = pal.ringFill
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(w / 2, ringCY, ringR, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  text(ctx, opts.ringLabel, w / 2, ringCY + 2, '700 44px "Space Mono", "Thmanyah Sans", monospace', pal.title, {
    dir: 'ltr',
  })
  text(ctx, opts.ringSub, w / 2, ringCY + ringR + 44, '400 30px "DM Sans", "Thmanyah Sans", sans-serif', pal.meaning, {
    dir: 'inherit',
  })

  // Checklist rows (marker + title; totals live in the ring + JSON export)
  const listTop = ringCY + ringR + 88
  const listBottom = h - 230
  const plan = planSummaryRows(opts.rows.length, listTop, listBottom)
  const rowFont = `400 ${plan.fontSize}px "Thmanyah Sans", "DM Sans", sans-serif`
  const measure = (t: string, f: string) => {
    ctx.font = f
    return ctx.measureText(t).width
  }
  const shown = opts.rows.slice(0, plan.rowsShown)
  const perCol = Math.ceil(shown.length / plan.columns)
  const colGap = 40
  const colW = plan.columns === 2 ? (w - 232 - colGap) / 2 : w - 232
  const colX = [116, 116 + colW + colGap]
  const fitTitle = (title: string) => {
    const maxTitleW = colW - 70
    let short = title
    while (short.length > 4 && measure(short + '…', rowFont) > maxTitleW) {
      short = short.slice(0, -2)
    }
    return short === title ? short : `${short}…`
  }
  shown.forEach((row, i) => {
    const col = Math.floor(i / perCol)
    const ri = i % perCol
    const x0 = colX[col]!
    const y = plan.listTop + ri * plan.rowH + plan.rowH / 2
    // marker
    ctx.save()
    ctx.strokeStyle = pal.check
    ctx.fillStyle = row.done ? pal.check : 'rgba(0,0,0,0)'
    ctx.lineWidth = 3
    const box = 26
    if (row.done) {
      ctx.fillRect(x0, y - box / 2, box, box)
      text(ctx, '✓', x0 + box / 2, y + 9, '700 24px "DM Sans", sans-serif', pal.bg, { dir: 'ltr' })
    } else {
      ctx.strokeRect(x0, y - box / 2, box, box)
    }
    ctx.restore()
    text(ctx, fitTitle(row.title), x0 + 44, y + plan.fontSize * 0.35, rowFont, pal.meaning, { align: 'left', dir: 'inherit' })
  })
  if (plan.truncated > 0) {
    const gridH = Math.ceil(plan.rowsShown / plan.columns) * plan.rowH
    text(ctx, opts.moreTemplate.replace('{n}', String(plan.truncated)), w / 2, plan.listTop + gridH + 30, '400 30px "DM Sans", sans-serif', pal.micro, {
      dir: 'inherit',
    })
  }

  drawFooter(
    ctx, pal, w,
    h - (opts.frame === 'square' ? 164 : 196),
    h - (opts.frame === 'square' ? 118 : 142),
    h - (opts.frame === 'square' ? 84 : 102),
    opts.wordmark, opts.warn1, opts.warn2,
  )
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
