import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common'

import { API_PREFIX } from '@/common/api-prefix'
import { CurrentUser } from '@/modules/auth/current-user.decorator'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { CreateUrlDto } from '@/modules/urls/dto/create-url.dto'
import { ListUrlsDto } from '@/modules/urls/dto/list-urls.dto'
import { CreatedUrl, UrlList, UrlsService } from '@/modules/urls/urls.service'

@Controller(`${API_PREFIX}/urls`)
@UseGuards(JwtAuthGuard)
export class UrlsController {
  constructor(private readonly urls: UrlsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query() query: ListUrlsDto): Promise<UrlList> {
    return this.urls.listForUser(userId, { limit: query.limit, offset: query.offset })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUrlDto, @CurrentUser('id') userId: string): Promise<CreatedUrl> {
    return this.urls.create(dto.url, userId)
  }
}
