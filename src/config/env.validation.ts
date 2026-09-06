import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  PORT: z.coerce.number().int().min(1).optional(),
  API_PREFIX: z.string().optional(),

  CORS_ORIGIN: z.string().min(1),
  COOKIE_SECRET: z.string().optional(),
  DEBUG_MODE: z.enum(['true', 'false']).optional(),

  DATABASE_URL: z.string(),

  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().min(1).optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().optional(),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  SLOW_QUERY_THRESHOLD_MS: z.coerce.number().int().optional(),

  THROTTLE_TTL: z.coerce.number().int().optional(),
  THROTTLE_LIMIT: z.coerce.number().int().optional(),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().optional(),

  SHORT_URL_BASE: z.string().url().optional(),
  SHORT_CODE_LENGTH: z.coerce.number().int().min(4).max(32).optional(),
  SHORT_CODE_MAX_RETRIES: z.coerce.number().int().min(1).optional(),

  CACHE_TTL_SECONDS: z.coerce.number().int().min(1).optional(),
  CACHE_NEGATIVE_TTL_SECONDS: z.coerce.number().int().min(1).optional(),
  CACHE_LOCK_TTL_MS: z.coerce.number().int().min(1).optional(),
  CLICKS_FLUSH_INTERVAL_MS: z.coerce.number().int().min(100).optional(),
})

export type EnvironmentVariables = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const result = envSchema.safeParse(config)

  if (!result.success) {
    const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')
    throw new Error(`Environment validation failed:\n${messages}`)
  }

  return result.data
}
