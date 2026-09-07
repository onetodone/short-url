import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'

import { CurrentUser } from '@/modules/auth/current-user.decorator'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { CreateUrlDto } from '@/modules/urls/dto/create-url.dto'
import { CreatedUrl, UrlsService } from '@/modules/urls/urls.service'

@Controller('urls')
export class UrlsController {
  constructor(private readonly urls: UrlsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateUrlDto, @CurrentUser('id') userId: string): Promise<CreatedUrl> {
    return this.urls.create(dto.url, userId)
  }
}
