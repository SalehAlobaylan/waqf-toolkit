/**
 * Procedural background patterns. All are drawn as paths/gradients — no image
 * assets, no uploads, nothing to moderate. Each is subtle by design: the text
 * is the subject, the ground is atmosphere.
 */

import type { BackgroundId } from '../engine/templates'
import type { CardPalette } from './palette'
import type { Ctx } from './ornaments'

function fill(ctx: Ctx, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
}

function glow(ctx: Ctx, w: number, h: number, palette: CardPalette) {
  const gradient = ctx.createRadialGradient(w / 2, -h * 0.22, 10, w / 2, -h * 0.22, h * 0.95)
  gradient.addColorStop(0, palette.glow)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

/** Paper: solid with a soft warm vignette. */
function paper(ctx: Ctx, w: number, h: number, palette: CardPalette) {
  fill(ctx, w, h, palette.bg)
  const shade = ctx.createLinearGradient(0, h * 0.7, 0, h)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(60,40,20,0.06)')
  ctx.save()
  ctx.fillStyle = shade
  ctx.fillRect(0, h * 0.7, w, h * 0.3)
  ctx.restore()
}

/** Lattice: eight-point stars + dots, clipped inside the frame. */
function lattice(ctx: Ctx, w: number, h: number, inset: number, palette: CardPalette) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(inset, inset, w - inset * 2, h - inset * 2)
  ctx.clip()
  ctx.strokeStyle = palette.lattice
  ctx.fillStyle = palette.lattice
  const step = 190
  for (let gy = 120; gy < h; gy += step) {
    for (let gx = 90; gx < w; gx += step) {
      const ox = ((gy / step) % 2) * step * 0.5
      ctx.save()
      ctx.globalAlpha = 0.045
      ctx.translate(gx + ox, gy)
      ctx.rotate(Math.PI / 4)
      ctx.lineWidth = 2
      ctx.strokeRect(-12, -12, 24, 24)
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
}

/** Girih: a denser interlaced star grid, very low alpha. */
function girih(ctx: Ctx, w: number, h: number, inset: number, palette: CardPalette) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(inset, inset, w - inset * 2, h - inset * 2)
  ctx.clip()
  ctx.strokeStyle = palette.pattern
  ctx.lineWidth = 1.5
  const step = 150
  for (let gy = 60; gy < h + step; gy += step) {
    for (let gx = 60; gx < w + step; gx += step) {
      const ox = ((gy / step) % 2) * step * 0.5
      ctx.save()
      ctx.globalAlpha = 0.05
      ctx.translate(gx + ox, gy)
      // 8-point star as two overlapping squares.
      ctx.strokeRect(-16, -16, 32, 32)
      ctx.save()
      ctx.rotate(Math.PI / 4)
      ctx.strokeRect(-16, -16, 32, 32)
      ctx.restore()
      ctx.restore()
    }
  }
  ctx.restore()
}

/** Arches: a row of pointed arches along the bottom third. */
function arches(ctx: Ctx, w: number, h: number, inset: number, palette: CardPalette) {
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.strokeStyle = palette.pattern
  ctx.lineWidth = 2
  const archW = 150
  const count = Math.ceil((w - inset * 2) / archW) + 1
  for (let i = 0; i < count; i++) {
    const cx = inset + i * archW + archW / 2
    const r = archW / 2
    const top = h * 0.62
    const height = h * 0.34
    ctx.beginPath()
    ctx.moveTo(cx - r, top + height)
    ctx.lineTo(cx - r, top + r)
    ctx.quadraticCurveTo(cx - r, top, cx, top)
    ctx.quadraticCurveTo(cx + r, top, cx + r, top + r)
    ctx.lineTo(cx + r, top + height)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawBackground(
  ctx: Ctx,
  id: BackgroundId,
  w: number,
  h: number,
  inset: number,
  palette: CardPalette,
) {
  switch (id) {
    case 'paper':
      paper(ctx, w, h, palette)
      break
    case 'glow':
      fill(ctx, w, h, palette.bg)
      glow(ctx, w, h, palette)
      break
    case 'lattice':
      fill(ctx, w, h, palette.bg)
      glow(ctx, w, h, palette)
      lattice(ctx, w, h, inset, palette)
      break
    case 'girih':
      fill(ctx, w, h, palette.bg)
      girih(ctx, w, h, inset, palette)
      break
    case 'arches':
      fill(ctx, w, h, palette.bg)
      glow(ctx, w, h, palette)
      arches(ctx, w, h, inset, palette)
      break
  }
}
