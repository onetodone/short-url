import { createHash, timingSafeEqual } from 'node:crypto'

export function hashSessionSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

export function verifySessionSecret(secret: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashSessionSecret(secret), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
}
