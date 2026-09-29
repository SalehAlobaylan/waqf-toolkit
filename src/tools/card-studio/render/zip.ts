/**
 * Store-only ZIP writer (no compression) for batch/carousel export.
 *
 * PNGs are already compressed, so deflate would buy ~nothing while adding a
 * dependency. Store-only is the honest choice here. Central directory + EOCD
 * per the APPNOTE spec; the test extracts the archive with a reader to prove
 * it is well-formed.
 */

import { crc32 } from './png-meta'

const encoder = new TextEncoder()

export type ZipEntry = { name: string; data: Uint8Array }

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >> 8) & 0xff])
}

/** ZIP stores multi-byte integers little-endian (PNG stores them big-endian). */
function u32(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ])
}

export function createZip(entries: ZipEntry[]): Uint8Array {
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    const local = new Uint8Array(30 + name.length)
    local.set(u32(0x04034b50), 0) // local file header signature
    local.set(u16(20), 4) // version needed
    local.set(u16(0), 6) // flags
    local.set(u16(0), 8) // method: store
    local.set(u16(0), 10) // mod time
    local.set(u16(0x21), 12) // mod date (1996-01-01, fixed → deterministic)
    local.set(u32(crc), 14)
    local.set(u32(size), 18)
    local.set(u32(size), 22)
    local.set(u16(name.length), 26)
    local.set(u16(0), 28)
    local.set(name, 30)
    chunks.push(local, entry.data)

    const dir = new Uint8Array(46 + name.length)
    dir.set(u32(0x02014b50), 0) // central directory signature
    dir.set(u16(20), 4) // version made by
    dir.set(u16(20), 6) // version needed
    dir.set(u16(0), 8)
    dir.set(u16(0), 10)
    dir.set(u16(0), 12)
    dir.set(u16(0x21), 14)
    dir.set(u32(crc), 16)
    dir.set(u32(size), 20)
    dir.set(u32(size), 24)
    dir.set(u16(name.length), 28)
    dir.set(u16(0), 30)
    dir.set(u16(0), 32)
    dir.set(u16(0), 34)
    dir.set(u16(0), 36)
    dir.set(u32(0), 38) // external attrs
    dir.set(u32(offset), 42)
    dir.set(name, 46)
    central.push(dir)

    offset += local.length + size
  }

  const centralSize = central.reduce((n, part) => n + part.length, 0)
  const eocd = new Uint8Array(22)
  eocd.set(u32(0x06054b50), 0)
  eocd.set(u16(0), 4)
  eocd.set(u16(0), 6)
  eocd.set(u16(entries.length), 8)
  eocd.set(u16(entries.length), 10)
  eocd.set(u32(centralSize), 12)
  eocd.set(u32(offset), 16)
  eocd.set(u16(0), 20)

  const total = chunks.reduce((n, part) => n + part.length, 0)
  const out = new Uint8Array(total + centralSize + 22)
  let cursor = 0
  for (const part of chunks) {
    out.set(part, cursor)
    cursor += part.length
  }
  for (const part of central) {
    out.set(part, cursor)
    cursor += part.length
  }
  out.set(eocd, cursor)
  return out
}
