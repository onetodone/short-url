import { Module } from '@nestjs/common'

import { AuthModule } from '@/modules/auth/auth.module'
import { ClicksService } from '@/modules/urls/clicks.service'
import { RedirectController } from '@/modules/urls/redirect.controller'
import { UrlsController } from '@/modules/urls/urls.controller'
import { UrlsService } from '@/modules/urls/urls.service'

@Module({
  imports: [AuthModule],
  controllers: [UrlsController, RedirectController],
  providers: [UrlsService, ClicksService],
})
export class UrlsModule {}
