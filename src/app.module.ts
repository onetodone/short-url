import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'

import { appConfig } from '@/config/app.config'
import { cacheConfig } from '@/config/cache.config'
import { databaseConfig } from '@/config/database.config'
import { jwtConfig } from '@/config/jwt.config'
import { redisConfig } from '@/config/redis.config'
import { shortenerConfig } from '@/config/shortener.config'
import { validateEnv } from '@/config/env.validation'
import { loggerOptions } from '@/common/logging/pino.config'
import { PrismaModule } from '@/database/prisma.module'
import { RedisModule } from '@/redis/redis.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { HealthModule } from '@/modules/health/health.module'
import { UrlsModule } from '@/modules/urls/urls.module'
import { AppController } from '@/app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, cacheConfig, shortenerConfig],
    }),
    LoggerModule.forRoot(loggerOptions),
    PrismaModule,
    RedisModule,
    AuthModule,
    HealthModule,
    UrlsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
