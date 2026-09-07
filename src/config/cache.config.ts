import { registerAs } from '@nestjs/config'

import { env } from '@/config/env'

export const cacheConfig = registerAs('cache', () => ({
  ttlSeconds: env.CACHE_TTL_SECONDS,
  negativeTtlSeconds: env.CACHE_NEGATIVE_TTL_SECONDS,
  lockTtlMs: env.CACHE_LOCK_TTL_MS,
  clicksFlushIntervalMs: env.CLICKS_FLUSH_INTERVAL_MS,
}))
