import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Fixtures shared by `scripts/seed-loadtest.ts` (writer) and `scripts/load-test.ts` (reader).
 * The credentials below belong to a throwaway account used only for local load testing.
 */
export const LOADTEST_USER_EMAIL = 'loadtest@short-url.local'
export const LOADTEST_USER_PASSWORD = 'loadtest-password-123'

/** Seeder writes it, runner reads it — one short code per line. Git-ignored. */
export const CODES_FILE = resolve(__dirname, '.loadtest-codes.txt')

/**
 * Base URL of the running app. Precedence: `--url` flag (runner only) > `LOADTEST_TARGET_URL`
 * > `SHORT_URL_BASE` > the dev default.
 */
export function resolveTargetUrl(): string {
  const raw = process.env.LOADTEST_TARGET_URL ?? process.env.SHORT_URL_BASE ?? 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export function writeCodesFile(codes: string[]): void {
  writeFileSync(CODES_FILE, codes.join('\n') + '\n', 'utf8')
}

export function readCodesFile(): string[] {
  if (!existsSync(CODES_FILE)) {
    throw new Error(`Short-code fixture not found at ${CODES_FILE}. Run "pnpm loadtest:seed" first.`)
  }

  const codes = readFileSync(CODES_FILE, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (codes.length === 0) {
    throw new Error(`Short-code fixture at ${CODES_FILE} is empty. Re-run "pnpm loadtest:seed".`)
  }

  return codes
}
