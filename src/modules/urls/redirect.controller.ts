import { Controller, Get, NotFoundException, Param, Redirect } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'

import { MetricsService } from '@/modules/metrics/metrics.service'
import { ClicksService } from '@/modules/urls/clicks.service'
import { UrlsService } from '@/modules/urls/urls.service'

const SHORT_CODE_PATTERN = /^[0-9A-Za-z]{4,32}$/
const REDIRECT_STATUS = 301

@SkipThrottle()
@Controller()
export class RedirectController {
  constructor(
    private readonly urls: UrlsService,
    private readonly clicks: ClicksService,
    private readonly metrics: MetricsService,
  ) {}

  @Get(':shortCode')
  @Redirect()
  async redirect(@Param('shortCode') shortCode: string): Promise<{ url: string; statusCode: number }> {
    if (!SHORT_CODE_PATTERN.test(shortCode)) {
      throw new NotFoundException('Short code not found')
    }

    const url = await this.urls.resolve(shortCode)

    this.clicks.increment(shortCode)
    this.metrics.increment('http_redirects_total')

    return { url, statusCode: REDIRECT_STATUS }
  }
}
