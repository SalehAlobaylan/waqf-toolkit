/**
 * Minimal PNG chunk writer used to embed provenance in exported images.
 *
 * Exports carry their own source of record: a `Description` (the same footer
 * text printed on the card) and `Software` (tool + version + dataset
 * revisions). Standard chunks, no dependencies. The card image is produced by
 * `canvas.toBlob`, so we parse the resulting PNG bytes and splice an `iTXt`
 * chunk in before `IEND` — the spec allows text chunks there.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

const encoder = new TextEncoder()

function u32(value: number): Uint8Array {
  return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff])
}

/** Build a PNG `iTXt` (UTF-8, uncompressed) chunk. */
export function textChunk(keyword: string, text: string): Uint8Array {
  const key = encoder.encode(keyword)
  const data = encoder.encode(text)
  // keyword\0 compressionFlag(0) compressionMethod(0) languageTag\0 translatedKeyword\0 text
  const body = new Uint8Array(key.length + 5 + data.length)
  body.set(key, 0)
  body[key.length] = 0 // null separator
  body[key.length + 1] = 0 // compression flag
  body[key.length + 2] = 0 // compression method
  body[key.length + 3] = 0 // empty language tag \0
  body[key.length + 4] = 0 // empty translated keyword \0
  body.set(data, key.length + 5)

  const chunk = new Uint8Array(12 + body.length)
  chunk.set(u32(body.length), 0)
  chunk.set([...encoder.encode('iTXt')], 4)
  chunk.set(body, 8)
  chunk.set(u32(crc32(chunk.subarray(4, 8 + body.length))), 8 + body.length)
  return chunk
}

const IEND = 'IEND'

/** Splice iTXt chunks into a PNG byte stream just before IEND. */
export function embedPngText(png: Uint8Array, entries: Record<string, string>): Uint8Array {
  const entriesList = Object.entries(entries).filter(([, value]) => value.trim() !== '')
  if (entriesList.length === 0) return png

  // Locate the IEND chunk: 4-byte length, "IEND", CRC.
  let offset = 8 // skip signature
  while (offset + 8 <= png.length) {
    const length =
      (png[offset]! << 24) | (png[offset + 1]! << 16) | (png[offset + 2]! << 8) | png[offset + 3]!
    const type = String.fromCharCode(png[offset + 4]!, png[offset + 5]!, png[offset + 6]!, png[offset + 7]!)
    if (type === IEND) break
    offset += 12 + length
  }
  if (offset + 8 > png.length) return png

  const chunks = entriesList.map(([key, value]) => textChunk(key, value))
  const insertAt = offset
  const extra = chunks.reduce((n, chunk) => n + chunk.length, 0)
  const out = new Uint8Array(png.length + extra)
  out.set(png.subarray(0, insertAt), 0)
  let cursor = insertAt
  for (const chunk of chunks) {
    out.set(chunk, cursor)
    cursor += chunk.length
  }
  out.set(png.subarray(insertAt), cursor)
  return out
}

/** Browser helper: embed text chunks into a PNG blob. */
export async function embedPngBlob(blob: Blob, entries: Record<string, string>): Promise<Blob> {
  if (blob.type !== 'image/png') return blob
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const out = embedPngText(bytes, entries)
  return out.length === bytes.length
    ? blob
    : new Blob([out as unknown as BlobPart], { type: 'image/png' })
}
