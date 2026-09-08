const DURATION_PATTERN = /^(\d+)\s*(s|m|h|d)?$/

const SECONDS_PER_UNIT: Record<string, number> = { s: 1, m: 60, h: 3_600, d: 86_400 }

export function parseDurationSeconds(value: string, fallback: number): number {
  const match = DURATION_PATTERN.exec(value.trim())
  if (!match) {
    return fallback
  }

  const amount = Number(match[1])
  const unit = match[2] ?? 's'
  return amount * SECONDS_PER_UNIT[unit]
}
