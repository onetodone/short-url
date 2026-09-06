import { registerAs } from '@nestjs/config'

export const cacheConfig = registerAs('cache', () => ({
  ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS ?? '3600', 10),
  negativeTtlSeconds: parseInt(process.env.CACHE_NEGATIVE_TTL_SECONDS ?? '60', 10),
  lockTtlMs: parseInt(process.env.CACHE_LOCK_TTL_MS ?? '3000', 10),
  clicksFlushIntervalMs: parseInt(process.env.CLICKS_FLUSH_INTERVAL_MS ?? '5000', 10),
}))
