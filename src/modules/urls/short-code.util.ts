import { randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const randomBytesAsync = promisify(randomBytes)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const ALPHABET_SIZE = ALPHABET.length // 62

const REJECTION_THRESHOLD = 256 - (256 % ALPHABET_SIZE)

export async function generateShortCode(length: number): Promise<string> {
  let code = ''

  while (code.length < length) {
    const buffer = await randomBytesAsync((length - code.length) * 2)

    for (const byte of buffer) {
      if (byte >= REJECTION_THRESHOLD) {
        continue
      }

      code += ALPHABET[byte % ALPHABET_SIZE]

      if (code.length === length) {
        break
      }
    }
  }

  return code
}
