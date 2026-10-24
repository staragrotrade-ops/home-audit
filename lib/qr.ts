// Server-only. A small QR code encoder (byte mode, error correction L,
// versions 1–5, mask 0) and a PNG writer, so referral QR codes are made here
// instead of by a third-party service. Enough for links up to 106 bytes.
import { crc32, deflateSync } from 'node:zlib'

// Version: [total codewords, data codewords, EC codewords per block, blocks, alignment centre]
const VERSIONS: Record<number, [number, number, number, number, number | null]> = {
  1: [26, 19, 7, 1, null],
  2: [44, 34, 10, 1, 18],
  3: [70, 55, 15, 1, 22],
  4: [100, 80, 20, 1, 26],
  5: [134, 108, 26, 1, 30],
}
const REMAINDER_BITS: Record<number, number> = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7 }

const EXP = new Array<number>(512)
const LOG = new Array<number>(256)
{
  let x = 1
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255]
}

function gmul(a: number, b: number) {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]
}

function errorCorrection(data: number[], count: number) {
  let generator = [1]
  for (let i = 0; i < count; i += 1) {
    const next = new Array<number>(generator.length + 1).fill(0)
    generator.forEach((g, j) => {
      next[j] ^= g
      next[j + 1] ^= gmul(g, EXP[i])
    })
    generator = next
  }
  const result = [...data, ...new Array<number>(count).fill(0)]
  for (let i = 0; i < data.length; i += 1) {
    const factor = result[i]
    if (!factor) continue
    generator.forEach((g, j) => {
      result[i + j] ^= gmul(g, factor)
    })
  }
  return result.slice(data.length)
}

/** The QR matrix (true = dark) for a short text. */
export function qrMatrix(text: string): boolean[][] {
  const bytes = [...Buffer.from(text, 'utf8')]
  const version = Number(
    Object.keys(VERSIONS).find((v) => {
      const dataCodewords = VERSIONS[Number(v)][1]
      return 4 + 8 + bytes.length * 8 <= dataCodewords * 8
    }),
  )
  if (!version) throw new Error('Text is too long for a QR code.')
  const [, dataCodewords, ecCodewords, , alignment] = VERSIONS[version]
  const size = version * 4 + 17

  let bits = '0100' + bytes.length.toString(2).padStart(8, '0') + bytes.map((b) => b.toString(2).padStart(8, '0')).join('')
  bits += '0'.repeat(Math.min(4, dataCodewords * 8 - bits.length))
  bits += '0'.repeat((8 - (bits.length % 8)) % 8)
  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) codewords.push(parseInt(bits.slice(i, i + 8), 2))
  for (let pad = 0; codewords.length < dataCodewords; pad += 1) codewords.push(pad % 2 === 0 ? 0xec : 0x11)
  const all = [...codewords, ...errorCorrection(codewords, ecCodewords)]
  const stream = all.map((c) => c.toString(2).padStart(8, '0')).join('') + '0'.repeat(REMAINDER_BITS[version])

  const m: (boolean | null)[][] = Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null))
  const finder = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const r = row + dr
        const c = col + dc
        if (r < 0 || c < 0 || r >= size || c >= size) continue
        const inside = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6
        m[r][c] = inside && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4))
      }
    }
  }
  finder(0, 0)
  finder(0, size - 7)
  finder(size - 7, 0)
  for (let i = 8; i < size - 8; i += 1) {
    m[6][i] = i % 2 === 0
    m[i][6] = i % 2 === 0
  }
  if (alignment) {
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) m[alignment + dr][alignment + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
    }
  }
  m[size - 8][8] = true
  const reserved = m.map((row) => row.map((cell) => cell !== null))
  for (let i = 0; i < 9; i += 1) {
    reserved[8][i] = true
    reserved[i][8] = true
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true
    reserved[size - 1 - i][8] = true
  }

  let index = 0
  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1
    for (let step = 0; step < size; step += 1) {
      const r = upward ? size - 1 - step : step
      for (const c of [col, col - 1]) {
        if (reserved[r][c]) continue
        let bit = index < stream.length ? stream[index] === '1' : false
        index += 1
        if ((r + c) % 2 === 0) bit = !bit // mask 0
        m[r][c] = bit
      }
    }
    upward = !upward
  }

  // Format information: error correction L (01), mask 0 (000).
  let format = 0b01000 << 10
  for (let i = 14; i >= 10; i -= 1) if (format & (1 << i)) format ^= 0b10100110111 << (i - 10)
  format = ((0b01000 << 10) | format) ^ 0b101010000010010
  const fb = (i: number) => ((format >> i) & 1) === 1
  for (let i = 0; i < 6; i += 1) m[i][8] = fb(i)
  m[7][8] = fb(6)
  m[8][8] = fb(7)
  m[8][7] = fb(8)
  for (let i = 9; i < 15; i += 1) m[8][14 - i] = fb(i)
  for (let i = 0; i < 8; i += 1) m[8][size - 1 - i] = fb(i)
  for (let i = 8; i < 15; i += 1) m[size - 15 + i][8] = fb(i)

  return m.map((row) => row.map(Boolean))
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([length, body, crc])
}

/** A black-on-white PNG of the QR code with a quiet zone. */
export function qrPng(text: string, scale = 12, border = 4) {
  const matrix = qrMatrix(text)
  const width = (matrix.length + border * 2) * scale
  const raw = Buffer.alloc((width + 1) * width, 255)
  for (let y = 0; y < width; y += 1) {
    raw[y * (width + 1)] = 0 // filter: none
    const row = Math.floor(y / scale) - border
    for (let x = 0; x < width; x += 1) {
      const col = Math.floor(x / scale) - border
      if (row >= 0 && col >= 0 && row < matrix.length && col < matrix.length && matrix[row][col]) {
        raw[y * (width + 1) + 1 + x] = 0
      }
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(width, 4)
  header[8] = 8 // bit depth
  header[9] = 0 // greyscale
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
