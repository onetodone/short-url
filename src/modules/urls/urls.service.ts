import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'

import { PrismaService } from '@/database/prisma.service'
import { MetricsService } from '@/modules/metrics/metrics.service'
import { InjectRedis } from '@/redis/redis.constants'
import { generateShortCode } from '@/modules/urls/short-code.util'
import { Prisma } from '@prisma-client'

export interface CreatedUrl {
  shortCode: string
  shortUrl: string
  originalUrl: string
  createdAt: Date
}

const NEGATIVE_SENTINEL = 'not-found'
const LOCK_WAIT_ATTEMPTS = 5
const LOCK_WAIT_INTERVAL_MS = 40

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

@Injectable()
export class UrlsService {
  private readonly logger = new Logger(UrlsService.name)

  private readonly codeLength: number
  private readonly maxRetries: number
  private readonly baseUrl: string
  private readonly ttlSeconds: number
  private readonly negativeTtlSeconds: number
  private readonly lockTtlMs: number

  private readonly inFlight = new Map<string, Promise<string>>()

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly metrics: MetricsService,
    config: ConfigService,
  ) {
    this.codeLength = config.get<number>('shortener.codeLength', 7)
    this.maxRetries = config.get<number>('shortener.maxRetries', 5)
    this.baseUrl = config.get<string>('shortener.baseUrl', 'http://localhost:3000')
    this.ttlSeconds = config.get<number>('cache.ttlSeconds', 3600)
    this.negativeTtlSeconds = config.get<number>('cache.negativeTtlSeconds', 60)
    this.lockTtlMs = config.get<number>('cache.lockTtlMs', 3000)
  }

  async create(originalUrl: string, userId: string | null): Promise<CreatedUrl> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      const shortCode = await generateShortCode(this.codeLength)

      try {
        const record = await this.prisma.url.create({
          data: { originalUrl, shortCode, userId },
          select: { shortCode: true, originalUrl: true, createdAt: true },
        })

        this.metrics.increment('urls_created_total')

        return {
          shortCode: record.shortCode,
          shortUrl: `${this.baseUrl}/${record.shortCode}`,
          originalUrl: record.originalUrl,
          createdAt: record.createdAt,
        }
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          this.logger.warn(
            `Short code collision on "${shortCode}" (attempt ${attempt}/${this.maxRetries}), regenerating`,
          )
          continue
        }
        throw error
      }
    }

    this.logger.error(`Exhausted ${this.maxRetries} attempts to allocate a unique short code`)
    throw new ServiceUnavailableException('Could not allocate a unique short code, please retry')
  }

  async resolve(shortCode: string): Promise<string> {
    const cached = await this.readCache(shortCode)
    if (cached !== null) {
      this.metrics.increment('cache_hits_total')
      this.logger.debug(`Cache Hit for "${shortCode}"`)
      if (cached === NEGATIVE_SENTINEL) {
        throw new NotFoundException('Short code not found')
      }
      return cached
    }

    this.metrics.increment('cache_misses_total')
    this.logger.debug(`Cache Miss for "${shortCode}"`)

    let task = this.inFlight.get(shortCode)
    if (!task) {
      task = this.fillFromDatabase(shortCode).finally(() => {
        this.inFlight.delete(shortCode)
      })
      this.inFlight.set(shortCode, task)
    }
    return task
  }

  private async readCache(shortCode: string): Promise<string | null> {
    try {
      return await this.redis.get(this.urlKey(shortCode))
    } catch (error) {
      this.logger.warn(`Redis GET failed for "${shortCode}": ${(error as Error).message}`)
      return null
    }
  }

  private async fillFromDatabase(shortCode: string): Promise<string> {
    const lock = await this.acquireLock(shortCode)

    if (lock === false) {
      const filled = await this.waitForCacheFill(shortCode)
      if (filled !== null) {
        if (filled === NEGATIVE_SENTINEL) {
          throw new NotFoundException('Short code not found')
        }
        return filled
      }
    }

    try {
      const record = await this.prisma.url.findUnique({
        where: { shortCode },
        select: { originalUrl: true },
      })

      if (!record) {
        await this.writeCache(this.urlKey(shortCode), NEGATIVE_SENTINEL, this.negativeTtlSeconds)
        throw new NotFoundException('Short code not found')
      }

      await this.writeCache(this.urlKey(shortCode), record.originalUrl, this.ttlSeconds)
      return record.originalUrl
    } finally {
      if (lock === true) {
        void this.releaseLock(shortCode)
      }
    }
  }

  private async acquireLock(shortCode: string): Promise<boolean | null> {
    try {
      const result = await this.redis.set(this.lockKey(shortCode), '1', 'PX', this.lockTtlMs, 'NX')
      return result === 'OK'
    } catch {
      return null
    }
  }

  private async releaseLock(shortCode: string): Promise<void> {
    try {
      await this.redis.del(this.lockKey(shortCode))
    } catch (error) {
      this.logger.warn(`Failed to release cache lock for "${shortCode}": ${(error as Error).message}`)
    }
  }

  private async waitForCacheFill(shortCode: string): Promise<string | null> {
    for (let attempt = 0; attempt < LOCK_WAIT_ATTEMPTS; attempt += 1) {
      await delay(LOCK_WAIT_INTERVAL_MS)
      const cached = await this.readCache(shortCode)
      if (cached !== null) {
        return cached
      }
    }
    return null
  }

  private async writeCache(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, value, 'EX', ttlSeconds)
    } catch (error) {
      this.logger.warn(`Redis SET failed for "${key}": ${(error as Error).message}`)
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  }

  private urlKey(shortCode: string): string {
    return `url:${shortCode}`
  }

  private lockKey(shortCode: string): string {
    return `lock:${shortCode}`
  }
}
