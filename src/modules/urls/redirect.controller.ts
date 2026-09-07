import { Controller, Get, NotFoundException, Param, Redirect } from '@nestjs/common'

import { ClicksService } from '@/modules/urls/clicks.service'
import { UrlsService } from '@/modules/urls/urls.service'

const SHORT_CODE_PATTERN = /^[0-9A-Za-z]{4,32}$/
const REDIRECT_STATUS = 301

@Controller()
export class RedirectController {
  constructor(
    private readonly urls: UrlsService,
    private readonly clicks: ClicksService,
  ) {}

  @Get(':shortCode')
  @Redirect()
  async redirect(@Param('shortCode') shortCode: string): Promise<{ url: string; statusCode: number }> {
    if (!SHORT_CODE_PATTERN.test(shortCode)) {
      throw new NotFoundException('Short code not found')
    }

    const url = await this.urls.resolve(shortCode)

    this.clicks.increment(shortCode)

    return { url, statusCode: REDIRECT_STATUS }
  }
}
