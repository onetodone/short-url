import { registerAs } from '@nestjs/config'

import { env } from '@/config/env'

export const appConfig = registerAs('app', () => ({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  corsOrigin: env.CORS_ORIGIN,
  cookieSecret: env.COOKIE_SECRET,
  throttleTtl: env.THROTTLE_TTL,
  throttleLimit: env.THROTTLE_LIMIT,
  slowQueryThresholdMs: env.SLOW_QUERY_THRESHOLD_MS,
  version: env.npm_package_version,
}))
