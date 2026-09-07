import fastifyCookie from '@fastify/cookie'
import { RequestMethod } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'

import { AppModule } from '@/app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 1_048_576 }),
    { bufferLogs: true },
  )

  app.useLogger(app.get(Logger))
  app.flushLogs()

  app.useGlobalPipes(new ZodValidationPipe())

  const config = app.get(ConfigService)
  const port = config.get<number>('app.port', 3000)
  const apiPrefix = config.get<string>('app.apiPrefix', 'api/v1')
  const corsOrigin = config.get<string>('app.corsOrigin', '*')
  const cookieSecret = config.get<string>('app.cookieSecret')

  await app.register(fastifyCookie, cookieSecret ? { secret: cookieSecret } : {})

  // The API sits under `apiPrefix`; the public redirect and the ops endpoints do not.
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
      { path: ':shortCode', method: RequestMethod.GET },
    ],
  })

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((entry) => entry.trim()),
    credentials: true,
  })

  app.enableShutdownHooks()

  await app.listen(port, '0.0.0.0')
}

void bootstrap()
