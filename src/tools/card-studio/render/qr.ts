/**
 * Tiny QR encoder (byte mode, error-correction M, versions 1–10).
 *
 * Purpose: encode a short "verify at source" deep-link string into a card so a
 * reader can open the exact design. The payload is ~60–200 characters, which
 * fits comfortably in these versions. The implementation is self-contained and
 * round-trip tested against a decoder in the test file — no dependency.
 *
 * Reference: ISO/IEC 18004. Reed–Solomon over GF(256) with the standard
 * primitive polynomial 0x11D.
 */

/**
 * Error-correction level M, versions 1–10:
 * [total codewords, ec codewords per block, blocks in group 1, data codewords
 * per block in group 1, blocks in group 2, data codewords per block in group 2].
 * Group 2 blocks (when present) hold one more data codeword than group 1.
 */
const EC_M: Record<number, [number, number, number, number, number, number]> = {
  1: [26, 10, 1, 16, 0, 0],
  2: [44, 16, 1, 28, 0, 0],
  3: [70, 26, 1, 44, 0, 0],
  4: [100, 18, 2, 32, 0, 0],
  5: [134, 24, 2, 43, 0, 0],
  6: [172, 16, 4, 27, 0, 0],
  7: [196, 18, 4, 31, 0, 0],
  8: [242, 22, 2, 38, 2, 39],
  9: [292, 22, 3, 36, 2, 37],
  10: [346, 26, 4, 43, 1, 44],
}

const ALIGN_POS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
}

// GF(256) tables
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a]! + LOG[b]!]!
}

function generatorPoly(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] = next[j]! ^ poly[j]!
      next[j + 1] = next[j + 1]! ^ gfMul(poly[j]!, EXP[i]!)
    }
    poly = next
  }
  return poly
}

function reedSolomon(data: number[], ecLen: number): number[] {
  const gen = generatorPoly(ecLen)
  const res = new Array(ecLen).fill(0)
  for (const byte of data) {
    const factor = byte ^ res[0]!
    res.shift()
    res.push(0)
    for (let i = 0; i < ecLen; i++) res[i] = res[i]! ^ gfMul(gen[i + 1]!, factor)
  }
  return res
}

function dataCapacityBytes(version: number): number {
  const [total, ecPerBlock, g1, d1, g2, d2] = EC_M[version]!
  void total
  void ecPerBlock
  return g1 * d1 + g2 * d2
}

export function smallestVersionFor(byteLength: number): number | null {
  for (let v = 1; v <= 10; v++) {
    // 4-bit count + 2 terminator cap; header = 2 bits count + byte mode 4 bits
    if (byteLength + 3 <= dataCapacityBytes(v)) return v
  }
  return null
}

function encodeData(text: string, version: number): number[] {
  const bytes = [...new TextEncoder().encode(text)]
  const bits: number[] = []
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1)
  }
  push(0b0100, 4) // byte mode
  push(bytes.length, version < 10 ? 8 : 16)
  for (const byte of bytes) push(byte, 8)
  const capacityBits = dataCapacityBytes(version)! * 8
  // terminator
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)
  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]!
    codewords.push(byte)
  }
  const pad = [0xec, 0x11]
  let pi = 0
  while (codewords.length < dataCapacityBytes(version)!) {
    codewords.push(pad[pi % 2]!)
    pi++
  }
  return codewords
}

function interleave(data: number[], version: number): number[] {
  const [total, ecPerBlock, g1, d1, g2, d2] = EC_M[version]!
  const sizes: number[] = []
  for (let i = 0; i < g1; i++) sizes.push(d1)
  for (let i = 0; i < g2; i++) sizes.push(d2)

  const dataBlocks: number[][] = []
  const ecBlocks: number[][] = []
  let cursor = 0
  for (const size of sizes) {
    const chunk = data.slice(cursor, cursor + size)
    cursor += size
    dataBlocks.push(chunk)
    ecBlocks.push(reedSolomon(chunk, ecPerBlock))
  }

  // Data codewords are interleaved column-wise, then the EC codewords.
  const out: number[] = []
  const maxData = Math.max(...dataBlocks.map((block) => block.length))
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) out.push(block[i]!)
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) out.push(block[i]!)
  }
  if (out.length !== total) {
    throw new Error(`qr-interleave-length ${out.length} != ${total}`)
  }
  return out
}

type Matrix = boolean[][]

function size(version: number): number {
  return version * 4 + 17
}

function newMatrix(n: number): { m: Matrix; reserved: Matrix } {
  return {
    m: Array.from({ length: n }, () => new Array<boolean>(n).fill(false)),
    reserved: Array.from({ length: n }, () => new Array<boolean>(n).fill(false)),
  }
}

function placeFinder(m: Matrix, reserved: Matrix, row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r
      const cc = col + c
      if (rr < 0 || rr >= m.length || cc < 0 || cc >= m.length) continue
      const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6)
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
      m[rr]![cc] = inRing || inCore
      reserved[rr]![cc] = true
    }
  }
}

function placeAlignment(m: Matrix, reserved: Matrix, version: number) {
  const positions = ALIGN_POS[version]!
  for (const r of positions) {
    for (const c of positions) {
      // Only the three finder corners are excluded: an alignment pattern may
      // legitimately overlap the timing lines, which are placed afterwards and
      // skip cells this marks.
      let collides = false
      for (let dr = -2; dr <= 2 && !collides; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (reserved[r + dr]?.[c + dc]) {
            collides = true
            break
          }
        }
      }
      if (collides) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          // 5×5 alignment pattern: dark outer ring + dark centre.
          const d = Math.max(Math.abs(dr), Math.abs(dc))
          m[r + dr]![c + dc] = d === 2 || d === 0
          reserved[r + dr]![c + dc] = true
        }
      }
    }
  }
}

function placeTiming(m: Matrix, reserved: Matrix) {
  const n = m.length
  for (let i = 8; i < n - 8; i++) {
    const bit = i % 2 === 0
    if (!reserved[6]?.[i]) {
      m[6]![i] = bit
      reserved[6]![i] = true
    }
    if (!reserved[i]?.[6]) {
      m[i]![6] = bit
      reserved[i]![6] = true
    }
  }
}

function placeFormat(m: Matrix, reserved: Matrix, ecBits: number, mask: number) {
  const n = m.length
  // BCH(15,5) format information, generator 0x537, masked with 0x5412.
  const data = (ecBits << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537)
  const bits = (((data << 10) | rem) ^ 0x5412) & 0x7fff
  const bit = (i: number) => ((bits >> i) & 1) === 1

  // First copy, around the top-left finder (bit 14 first).
  const first: [number, number, number][] = [
    [8, 0, 14], [8, 1, 13], [8, 2, 12], [8, 3, 11], [8, 4, 10],
    [8, 5, 9], [8, 7, 8], [8, 8, 7], [7, 8, 6], [5, 8, 5],
    [4, 8, 4], [3, 8, 3], [2, 8, 2], [1, 8, 1], [0, 8, 0],
  ]
  // Second copy: bottom-left vertical, top-right horizontal.
  const second: [number, number, number][] = [
    [n - 1, 8, 14], [n - 2, 8, 13], [n - 3, 8, 12], [n - 4, 8, 11],
    [n - 5, 8, 10], [n - 6, 8, 9], [n - 7, 8, 8],
    [8, n - 8, 7], [8, n - 7, 6], [8, n - 6, 5], [8, n - 5, 4],
    [8, n - 4, 3], [8, n - 3, 2], [8, n - 2, 1], [8, n - 1, 0],
  ]
  for (const [r, c, index] of [...first, ...second]) {
    m[r]![c] = bit(index)
    reserved[r]![c] = true
  }
  // The dark module is always set.
  m[n - 8]![8] = true
  reserved[n - 8]![8] = true
}

function placeVersionInfo(m: Matrix, reserved: Matrix, version: number) {
  if (version < 7) return
  const n = m.length
  let rem = version
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ (((rem >> 11) & 1) * 0x1f25)
  const bits = (version << 12) | rem
  const bit = (i: number) => ((bits >> i) & 1) === 1
  for (let i = 0; i < 18; i++) {
    const a = Math.floor(i / 3)
    const b = (i % 3) + n - 11
    m[a]![b] = bit(i)
    reserved[a]![b] = true
    m[b]![a] = bit(i)
    reserved[b]![a] = true
  }
}

function maskFn(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0
    case 1: return r % 2 === 0
    case 2: return c % 3 === 0
    case 3: return (r + c) % 3 === 0
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0
    default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  }
}

function penalty(m: Matrix): number {
  const n = m.length
  let score = 0
  // rule 1: runs
  for (let i = 0; i < n; i++) {
    let runRow = 1
    let runCol = 1
    for (let j = 1; j < n; j++) {
      if (m[i]![j] === m[i]![j - 1]) runRow++
      else {
        if (runRow >= 5) score += runRow - 2
        runRow = 1
      }
      if (m[j]![i] === m[j - 1]![i]) runCol++
      else {
        if (runCol >= 5) score += runCol - 2
        runCol = 1
      }
    }
    if (runRow >= 5) score += runRow - 2
    if (runCol >= 5) score += runCol - 2
  }
  // rule 2: 2x2 blocks
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1; j++) {
      const v = m[i]![j]
      if (v === m[i]![j + 1] && v === m[i + 1]![j] && v === m[i + 1]![j + 1]) score += 3
    }
  }
  // rule 3: finder-like patterns
  const pattern = [true, false, true, true, true, false, true]
  const matches = (get: (k: number) => boolean) => {
    let count = 0
    for (let k = 0; k + 7 <= n; k++) {
      let ok = true
      for (let t = 0; t < 7; t++) if (get(k + t) !== pattern[t]) ok = false
      if (ok) count++
    }
    return count
  }
  score += 40 * matches((k) => m[Math.floor(k / n)]![k % n]!)
  score += 40 * matches((k) => m[k % n]![Math.floor(k / n)]!)
  // rule 4: dark ratio
  let dark = 0
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (m[i]![j]) dark++
  const ratio = (dark * 100) / (n * n)
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10
  return score
}

const EC_BITS_M = 0b00 // error correction level M

export type QrCode = {
  version: number
  size: number
  modules: boolean[][]
}

/** Encode `text` (UTF-8) into a boolean matrix. Returns null if too long. */
export function encodeQr(text: string): QrCode | null {
  const byteLength = new TextEncoder().encode(text).length
  const version = smallestVersionFor(byteLength)
  if (!version) return null

  const codewords = interleave(encodeData(text, version), version)
  const n = size(version)
  const { m, reserved } = newMatrix(n)
  placeFinder(m, reserved, 0, 0)
  placeFinder(m, reserved, 0, n - 7)
  placeFinder(m, reserved, n - 7, 0)
  placeAlignment(m, reserved, version)
  placeTiming(m, reserved)
  placeFormat(m, reserved, EC_BITS_M, 0)
  placeVersionInfo(m, reserved, version)

  // data placement (zigzag, right to left, skipping the vertical timing)
  let bitIndex = 0
  const dataBits: number[] = []
  for (const byte of codewords) {
    for (let i = 7; i >= 0; i--) dataBits.push((byte >> i) & 1)
  }
  let upward = true
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col-- // skip vertical timing column
    for (let i = 0; i < n; i++) {
      const row = upward ? n - 1 - i : i
      for (const c of [col, col - 1]) {
        if (reserved[row]?.[c]) continue
        if (bitIndex < dataBits.length) {
          m[row]![c] = dataBits[bitIndex] === 1
          bitIndex++
        }
      }
    }
    upward = !upward
  }

  // choose the best mask
  let best = 0
  let bestPenalty = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const { m: test, reserved: res } = newMatrix(n)
    placeFinder(test, res, 0, 0)
    placeFinder(test, res, 0, n - 7)
    placeFinder(test, res, n - 7, 0)
    placeAlignment(test, res, version)
    placeTiming(test, res)
    placeFormat(test, res, EC_BITS_M, mask)
    placeVersionInfo(test, res, version)
    let idx = 0
    let up = true
    for (let c = n - 1; c > 0; c -= 2) {
      if (c === 6) c--
      for (let i = 0; i < n; i++) {
        const row = up ? n - 1 - i : i
        for (const cc of [c, c - 1]) {
          if (res[row]?.[cc]) continue
          const bit = idx < dataBits.length ? dataBits[idx] === 1 : false
          if (maskFn(mask, row, cc)) test[row]![cc] = !bit
          else test[row]![cc] = bit
          idx++
        }
      }
      up = !up
    }
    const p = penalty(test)
    if (p < bestPenalty) {
      bestPenalty = p
      best = mask
    }
  }

  // final matrix with the chosen mask
  const { m: final, reserved: res } = newMatrix(n)
  placeFinder(final, res, 0, 0)
  placeFinder(final, res, 0, n - 7)
  placeFinder(final, res, n - 7, 0)
  placeAlignment(final, res, version)
  placeTiming(final, res)
  placeFormat(final, res, EC_BITS_M, best)
  placeVersionInfo(final, res, version)
  let idx = 0
  let up = true
  for (let c = n - 1; c > 0; c -= 2) {
    if (c === 6) c--
    for (let i = 0; i < n; i++) {
      const row = up ? n - 1 - i : i
      for (const cc of [c, c - 1]) {
        if (res[row]?.[cc]) continue
        const bit = idx < dataBits.length ? dataBits[idx] === 1 : false
        if (maskFn(best, row, cc)) final[row]![cc] = !bit
        else final[row]![cc] = bit
        idx++
      }
    }
    up = !up
  }

  return { version, size: n, modules: final }
}

/** Draw a QR (with a quiet zone) onto a canvas context. */
export function drawQr(
  ctx: CanvasRenderingContext2D,
  qr: QrCode,
  x: number,
  y: number,
  size: number,
  dark: string,
  light: string,
) {
  const quiet = 2
  const total = qr.size + quiet * 2
  const module = size / total
  ctx.save()
  ctx.fillStyle = light
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = dark
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (!qr.modules[r]![c]) continue
      ctx.fillRect(
        x + (c + quiet) * module,
        y + (r + quiet) * module,
        Math.ceil(module),
        Math.ceil(module),
      )
    }
  }
  ctx.restore()
}
