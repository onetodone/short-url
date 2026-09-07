import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SkipThrottle } from '@nestjs/throttler'

import { API_PREFIX } from '@/common/api-prefix'

@SkipThrottle()
@Controller(API_PREFIX)
export class AppController {
  private readonly version: string

  constructor(config: ConfigService) {
    this.version = config.get<string>('app.version', '0.0.0')
  }

  @Get()
  info(): { name: string; version: string } {
    return { name: 'short-url-api', version: this.version }
  }
}
