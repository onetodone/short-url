import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { CreateUrlDto } from '@/modules/urls/dto/create-url.dto'
import { CreatedUrl, UrlsService } from '@/modules/urls/urls.service'

@Controller('urls')
export class UrlsController {
  constructor(private readonly urls: UrlsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUrlDto): Promise<CreatedUrl> {
    return this.urls.create(dto.url, null)
  }
}
