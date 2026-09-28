/**
 * Procedural ornament kit — every flourish is drawn as vector paths, so the
 * design system costs bytes-of-code, not bytes-of-images, and needs no
 * moderation. Sets are named for what they evoke, not for any religious claim.
 */

export type Ctx = CanvasRenderingContext2D

/** Set stroke/fill style on a saved context. Caller must call `ctx.restore()`. */
function style(ctx: Ctx, color: string, width: number, alpha = 1) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.globalAlpha = alpha
}

/** Eight-point star (khatam) — the workhorse of the kit. */
export function drawStar8(ctx: Ctx, cx: number, cy: number, size: number, color: string, alpha = 0.9) {
  style(ctx, color, 2, alpha)
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i
    const px = cx + size * Math.cos(angle)
    const py = cy + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

/** Interlaced rosette: star8 + inner square. */
export function drawRosette(ctx: Ctx, cx: number, cy: number, size: number, color: string, alpha = 0.85) {
  drawStar8(ctx, cx, cy, size, color, alpha)
  style(ctx, color, 1.5, alpha * 0.8)
  ctx.translate(cx, cy)
  ctx.rotate(Math.PI / 4)
  const half = size * 0.5
  ctx.strokeRect(-half, -half, half * 2, half * 2)
  ctx.restore()
}

/** Pointed arch (mihrab-like) used as a header or a background row. */
export function drawArch(ctx: Ctx, cx: number, top: number, w: number, h: number, color: string, alpha = 0.5) {
  style(ctx, color, 2, alpha)
  const r = w / 2
  ctx.beginPath()
  ctx.moveTo(cx - r, top + h)
  ctx.lineTo(cx - r, top + r)
  ctx.quadraticCurveTo(cx - r, top, cx, top)
  ctx.quadraticCurveTo(cx + r, top, cx + r, top + r)
  ctx.lineTo(cx + r, top + h)
  ctx.stroke()
  ctx.restore()
}

/** Double frame around the whole card. */
export function drawFrame(ctx: Ctx, w: number, h: number, inset: number, outer: string, inner: string) {
  style(ctx, outer, 5, 1)
  ctx.strokeRect(inset - 10, inset - 10, w - (inset - 10) * 2, h - (inset - 10) * 2)
  ctx.restore()
  style(ctx, inner, 2, 0.65)
  ctx.strokeRect(inset + 12, inset + 12, w - (inset + 12) * 2, h - (inset + 12) * 2)
  ctx.restore()
}

/** Small centered ornament (line + diamond) above the text. */
export function drawTopOrnament(ctx: Ctx, w: number, y: number, color: string) {
  style(ctx, color, 2, 0.9)
  const cx = w / 2
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

/** Divider between blocks. */
export function drawDivider(ctx: Ctx, w: number, y: number, color: string) {
  style(ctx, color, 1.5, 0.7)
  const cx = w / 2
  ctx.beginPath()
  ctx.moveTo(cx - 110, y)
  ctx.lineTo(cx - 22, y)
  ctx.moveTo(cx + 22, y)
  ctx.lineTo(cx + 110, y)
  ctx.stroke()
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.moveTo(cx, y - 7)
  ctx.lineTo(cx + 7, y)
  ctx.lineTo(cx, y + 7)
  ctx.lineTo(cx - 7, y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** A row of small stars (header or footer band). */
export function drawStarRow(ctx: Ctx, w: number, y: number, size: number, color: string, alpha = 0.5) {
  const step = 150
  const count = Math.floor((w - 120) / step)
  const start = (w - (count - 1) * step) / 2
  for (let i = 0; i < count; i++) {
    drawStar8(ctx, start + i * step, y, size, color, alpha)
  }
}

export type OrnamentSetId = 'minimal' | 'flourish' | 'mihrab' | 'border'

/** Ornament set dispatch for the top ornament + optional header motif. */
export function drawOrnamentSet(
  ctx: Ctx,
  set: OrnamentSetId,
  w: number,
  h: number,
  inset: number,
  y: number,
  color: string,
) {
  switch (set) {
    case 'minimal':
      drawTopOrnament(ctx, w, y, color)
      break
    case 'flourish':
      drawTopOrnament(ctx, w, y, color)
      drawRosette(ctx, w / 2, y, 22, color, 0.7)
      break
    case 'mihrab':
      drawArch(ctx, w / 2, inset, 220, 90, color, 0.6)
      drawTopOrnament(ctx, w, y, color)
      break
    case 'border':
      drawStarRow(ctx, w, y, 14, color, 0.6)
      drawTopOrnament(ctx, w, y + 46, color)
      break
  }
}
