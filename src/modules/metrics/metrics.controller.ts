import { Controller, Get, Header } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'

import { MetricsService } from '@/modules/metrics/metrics.service'

@SkipThrottle()
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  scrape(): string {
    return this.metrics.render()
  }
}
