// Server-only. AES-256-GCM envelope for stored OAuth tokens.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

type Envelope = { v: 1; alg: 'A256GCM'; iv: string; tag: string; ciphertext: string }

function keyFromEnv() {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!raw) throw new Error('INTEGRATION_ENCRYPTION_KEY is not configured.')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('INTEGRATION_ENCRYPTION_KEY must be a base64-encoded 32-byte key.')
  return key
}

export function encryptCredentials(value: unknown): Envelope {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFromEnv(), iv)
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(value), 'utf8')), cipher.final()])
  return {
    v: 1,
    alg: 'A256GCM',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

export function decryptCredentials<T>(value: unknown): T {
  const envelope = value as Envelope
  if (!envelope || envelope.v !== 1 || envelope.alg !== 'A256GCM') {
    throw new Error('Stored credentials are not readable. Reconnect the service.')
  }
  const decipher = createDecipheriv('aes-256-gcm', keyFromEnv(), Buffer.from(envelope.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ])
  return JSON.parse(plaintext.toString('utf8')) as T
}
