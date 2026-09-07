import { registerAs } from '@nestjs/config'

import { env } from '@/config/env'

export const databaseConfig = registerAs('database', () => ({
  url: env.DATABASE_URL,
}))
