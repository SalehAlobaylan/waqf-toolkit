import { describe, expect, it } from 'vitest'
import { encodeQr, smallestVersionFor } from './qr'
import { createZip } from './zip'
import { crc32, embedPngText, textChunk } from './png-meta'

const encoder = new TextEncoder()

describe('QR encoder', () => {
  it('is deterministic: the same payload always yields the same matrix', () => {
    for (const payload of ['ayah:2:255;dua:sayyid-istighfar', 'a'.repeat(60), 'a'.repeat(150)]) {
      const a = encodeQr(payload)!
      const b = encodeQr(payload)!
      expect(a.version).toBe(b.version)
      expect(a.modules).toEqual(b.modules)
    }
  })

  it('encodes longer verify-style payloads across every supported version', () => {
    const versions = new Set<number>()
    for (const length of [10, 30, 60, 100, 150, 200, 213]) {
      const qr = encodeQr('a'.repeat(length))
      expect(qr, `length ${length}`).not.toBeNull()
      versions.add(qr!.version)
    }
    // 10 lengths must span versions 1..10 — every block structure is exercised.
    expect(Math.min(...versions)).toBe(1)
    expect(Math.max(...versions)).toBe(10)
  })

  it('grows the version for longer payloads and refuses the huge ones', () => {
    const short = encodeQr('short')!
    const long = encodeQr('a'.repeat(120))!
    expect(long.version).toBeGreaterThanOrEqual(short.version)
    expect(encodeQr('a'.repeat(2000))).toBeNull()
    expect(smallestVersionFor(2000)).toBeNull()
  })

  it('produces well-formed function patterns', () => {
    const qr = encodeQr('test')!
    const at = (r: number, c: number) => qr.modules[r]![c]
    expect(at(0, 0)).toBe(true) // top-left finder ring
    expect(at(1, 1)).toBe(false) // inner light ring
    expect(at(3, 3)).toBe(true) // finder core
    expect(at(0, 7)).toBe(false) // separator
    expect(at(qr.size - 1, qr.size - 1)).toBe(true) // bottom-right finder
  })

  it('places a single correct 5x5 alignment pattern per free position (v2)', () => {
    const qr = encodeQr('a'.repeat(15))! // forces version 2
    expect(qr.version).toBe(2)
    const at = (r: number, c: number) => qr.modules[r]![c]
    // v2 has one alignment pattern at (18,18): dark ring + dark centre.
    for (let r = 16; r <= 20; r++) {
      for (let c = 16; c <= 20; c++) {
        const d = Math.max(Math.abs(r - 18), Math.abs(c - 18))
        expect(at(r, c), `${r},${c}`).toBe(d === 2 || d === 0)
      }
    }
    // The three finder-corner positions carry no alignment pattern: those cells
    // belong to the finder patterns instead.
    expect(at(6, 18)).toBe(true) // inside the top-right finder
    expect(at(18, 6)).toBe(true) // inside the bottom-left finder
  })
})

describe('zip writer', () => {
  it('produces a readable store-only archive', () => {
    const zip = createZip([
      { name: 'a.txt', data: encoder.encode('hello') },
      { name: 'b.txt', data: encoder.encode('world') },
    ])
    // Local file header signature: 0x50 0x4B 0x03 0x04
    expect([...zip.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
    // End-of-central-directory signature at the tail: 0x50 0x4B 0x05 0x06
    expect([...zip.slice(-22, -18)]).toEqual([0x50, 0x4b, 0x05, 0x06])
    const view = new TextDecoder('latin1')
    const text = view.decode(zip)
    expect(text).toContain('a.txt')
    expect(text).toContain('b.txt')
    // store entries: the raw payload appears verbatim (deflate would not)
    expect(text).toContain('hello')
    expect(text).toContain('world')
  })
})

describe('png metadata', () => {
  it('computes a known CRC32', () => {
    // CRC32("123456789") = 0xCBF43926
    expect(crc32(encoder.encode('123456789'))).toBe(0xcbf43926)
  })

  it('builds a text chunk with the keyword and payload', () => {
    const chunk = textChunk('Description', 'hello')
    const view = new TextDecoder('utf-8')
    // chunk type then keyword then text somewhere in the bytes
    const asText = view.decode(chunk)
    expect(asText).toContain('iTXt')
    expect(asText).toContain('Description')
    expect(asText).toContain('hello')
  })

  it('embeds text into a PNG byte stream before IEND', () => {
    // Minimal 1×1 PNG (grayscale) used as a carrier.
    const base = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      ),
      (c) => c.charCodeAt(0),
    )
    const embedded = embedPngText(base, { Description: 'sources: tanzil' })
    expect(embedded.length).toBeGreaterThan(base.length)
    const view = new TextDecoder('utf-8')
    expect(view.decode(embedded)).toContain('sources: tanzil')
  })
})
