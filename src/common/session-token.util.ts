import { randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const randomBytesAsync = promisify(randomBytes)

const SESSION_SECRET_BYTES = 32

export interface ParsedSessionToken {
  sessionId: string
  secret: string
}

export async function generateSessionSecret(): Promise<string> {
  const buffer = await randomBytesAsync(SESSION_SECRET_BYTES)
  return buffer.toString('base64url')
}

export function encodeSessionToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`
}

export function parseSessionToken(raw: string): ParsedSessionToken | null {
  const separatorIndex = raw.indexOf('.')
  if (separatorIndex === -1 || raw.indexOf('.', separatorIndex + 1) !== -1) {
    return null
  }

  const sessionId = raw.slice(0, separatorIndex)
  const secret = raw.slice(separatorIndex + 1)
  if (!sessionId || !secret) {
    return null
  }

  return { sessionId, secret }
}
