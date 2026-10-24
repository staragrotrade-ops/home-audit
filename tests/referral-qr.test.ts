import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { inflateSync } from 'node:zlib'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const qr = await import('../lib/qr.ts')

test('QR matrix: right size per version, finder patterns in the three corners', () => {
  for (const [text, size] of [['hi', 21], ['https://homeaudit.com.au/?ref=jane7k2mxyzq', 29]] as const) {
    const m = qr.qrMatrix(text)
    assert.equal(m.length, size)
    for (const [r, c] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
      assert.equal(m[r][c], true)
      assert.equal(m[r + 1][c + 1], false)
      assert.equal(m[r + 3][c + 3], true)
    }
  }
  assert.throws(() => qr.qrMatrix('x'.repeat(200)), /too long/)
})

test('QR PNG: a valid greyscale PNG with dark and light pixels', () => {
  const png: Buffer = qr.qrPng('https://homeaudit.com.au/?ref=jane7k2m')
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const width = png.readUInt32BE(16)
  assert.equal(width, (29 + 8) * 12)
  const idat = png.indexOf('IDAT')
  const length = png.readUInt32BE(idat - 4)
  const raw = inflateSync(png.subarray(idat + 4, idat + 4 + length))
  assert.equal(raw.length, (width + 1) * width)
  assert.ok(raw.includes(0) && raw.includes(255))
})

test('referral email: QR shown in the body and attached; signed by Alan Hou with his mobile', async () => {
  const emails = await source('lib/order-emails.ts')
  assert.match(emails, /<img src="cid:\$\{REFERRAL_QR_CONTENT_ID\}"/)
  assert.match(emails, /contentId: REFERRAL_QR_CONTENT_ID/)
  assert.match(emails, /OWNER_SIGNATURE_NAME, 'Home Audit', `Mobile \$\{OWNER_MOBILE\}`/)
  const site = await source('lib/site.ts')
  assert.match(site, /OWNER_SIGNATURE_NAME = 'Alan Hou'/)
  assert.match(site, /OWNER_MOBILE = '0416 276 119'/)
  const sender = await source('lib/referrer-emails.ts')
  assert.match(sender, /qrPng\(link\)\.toString\('base64'\)/)
  const mail = await source('lib/email.ts')
  assert.match(mail, /content_id: file\.contentId/)
  assert.doesNotMatch(await source('lib/referrals.ts'), /qrserver/)
})
