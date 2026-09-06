import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@prisma-client'
import type { Prisma } from '@prisma-client'

const PrismaClientWithQueryLog = PrismaClient as new (options: Prisma.PrismaClientOptions) => PrismaClient<'query'>

@Injectable()
export class PrismaService extends PrismaClientWithQueryLog implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private readonly slowQueryThresholdMs: number

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('database.url')

    super({
      adapter: new PrismaPg({ connectionString }),
      log: [{ emit: 'event', level: 'query' }],
    })

    this.slowQueryThresholdMs = config.get<number>('app.slowQueryThresholdMs', 200)
  }

  async onModuleInit(): Promise<void> {
    this.$on('query', (event) => {
      if (event.duration >= this.slowQueryThresholdMs) {
        this.logger.warn(
          `Slow query (${event.duration.toFixed(1)}ms >= ${this.slowQueryThresholdMs}ms): ${event.query}`,
        )
      }
    })

    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
