import { Controller, Get } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'

@SkipThrottle()
@Controller()
export class AppController {
  @Get()
  info(): { name: string; version: string } {
    return { name: 'short-url-api', version: process.env.npm_package_version ?? '0.0.0' }
  }
}
