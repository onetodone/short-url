import { registerAs } from '@nestjs/config'

import { env } from '@/config/env'

export const jwtConfig = registerAs('jwt', () => ({
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
}))
