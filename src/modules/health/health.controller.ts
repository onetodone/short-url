import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { Redis } from 'ioredis'

import { PrismaService } from '@/database/prisma.service'
import { InjectRedis } from '@/redis/redis.constants'

type ComponentStatus = 'up' | 'down'

interface ReadinessReport {
  status: 'ok' | 'degraded'
  database: ComponentStatus
  redis: ComponentStatus
}

const READINESS_PROBE_TIMEOUT_MS = 1000

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Get('health')
  live(): { status: 'ok' } {
    return { status: 'ok' }
  }

  @Get('health/ready')
  async ready(): Promise<ReadinessReport> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()])
    const healthy = database === 'up' && redis === 'up'
    const report: ReadinessReport = {
      status: healthy ? 'ok' : 'degraded',
      database,
      redis,
    }

    if (!healthy) {
      throw new ServiceUnavailableException(report)
    }

    return report
  }

  private async checkDatabase(): Promise<ComponentStatus> {
    try {
      await this.withTimeout(this.prisma.$queryRaw`SELECT 1`, 'database')
      return 'up'
    } catch {
      return 'down'
    }
  }

  private async checkRedis(): Promise<ComponentStatus> {
    try {
      const pong = await this.withTimeout(this.redis.ping(), 'redis')
      return pong === 'PONG' ? 'up' : 'down'
    } catch {
      return 'down'
    }
  }

  private withTimeout<T>(work: Promise<T>, label: string): Promise<T> {
    return Promise.race([
      work,
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`${label} readiness probe timed out after ${READINESS_PROBE_TIMEOUT_MS}ms`)),
          READINESS_PROBE_TIMEOUT_MS,
        ).unref()
      }),
    ])
  }
}
