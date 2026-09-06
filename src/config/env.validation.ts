import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  PORT: z.coerce.number().int().min(1).optional(),
  API_PREFIX: z.string().optional(),
  CORS_ORIGIN: z.string().min(1),
  COOKIE_SECRET: z.string().optional(),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().min(1).optional(),
  REDIS_PASSWORD: z.string().optional(),
  SLOW_QUERY_THRESHOLD_MS: z.coerce.number().int().optional(),
  THROTTLE_TTL: z.coerce.number().int().optional(),
  THROTTLE_LIMIT: z.coerce.number().int().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().optional(),
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
