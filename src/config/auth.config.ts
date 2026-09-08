import { registerAs } from '@nestjs/config'

import { env } from '@/config/env'

export const authConfig = registerAs('auth', () => ({
  sessionCleanupIntervalMs: env.SESSION_CLEANUP_INTERVAL_MS,
}))
