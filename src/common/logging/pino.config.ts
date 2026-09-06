import type { Params } from 'nestjs-pino'
import type { IncomingMessage } from 'node:http'

const isProduction = process.env.NODE_ENV === 'production'

type AuthenticatedMessage = IncomingMessage & { user?: { id?: string } }

export const loggerOptions: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: { singleLine: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
        },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
        '*.jwt',
      ],
      censor: '[redacted]',
    },
    customProps: (req) => ({
      userId: (req as AuthenticatedMessage).user?.id ?? null,
    }),
  },
}
