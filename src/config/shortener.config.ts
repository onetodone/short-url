import { registerAs } from '@nestjs/config'

export const shortenerConfig = registerAs('shortener', () => ({
  baseUrl: (process.env.SHORT_URL_BASE ?? `http://localhost:${process.env.PORT ?? '3000'}`).replace(/\/+$/, ''),
  codeLength: parseInt(process.env.SHORT_CODE_LENGTH ?? '7', 10),
  maxRetries: parseInt(process.env.SHORT_CODE_MAX_RETRIES ?? '5', 10),
}))
