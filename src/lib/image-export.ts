/**
 * Canvas export helpers shared by image-card tools: format support detection,
 * blob encoding, download, and byte formatting. Browser-only at call time.
 */

export type ImageFormat = 'png' | 'jpeg' | 'webp'

export const FORMAT_MIME: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export const FORMAT_QUALITY: Record<ImageFormat, number | undefined> = {
  png: undefined,
  jpeg: 0.92,
  webp: 0.9,
}

export const FORMAT_EXT: Record<ImageFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
}

/** Pick a supported format, falling back to PNG. Pure — `supported` is injected for tests. */
export function pickFormat(requested: ImageFormat, supported: ImageFormat[]): ImageFormat {
  if (supported.includes(requested)) return requested
  return 'png'
}

export function hasArabic(str: string): boolean {
  return /[\u0600-\u06FF]/.test(str)
}

export function toBlob(canvas: HTMLCanvasElement, format: ImageFormat): Promise<Blob> {
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
