import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '@/database/prisma.service'

@Injectable()
export class SessionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionCleanupService.name)
  private readonly intervalMs: number

  private timer: NodeJS.Timeout | null = null
  private running = false

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.intervalMs = config.get<number>('auth.sessionCleanupIntervalMs', 3_600_000)
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.sweep()
    }, this.intervalMs)
    this.timer.unref()
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async sweep(): Promise<void> {
    if (this.running) {
      return
    }
    this.running = true

    try {
      const { count } = await this.prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })
      if (count > 0) {
        this.logger.debug(`Swept ${count} expired session(s)`)
      }
    } catch (error) {
      this.logger.warn(`Session sweep failed: ${(error as Error).message}`)
    } finally {
      this.running = false
    }
  }
}
