import { Global, Module } from '@nestjs/common'

import { MetricsController } from '@/modules/metrics/metrics.controller'
import { MetricsService } from '@/modules/metrics/metrics.service'

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
