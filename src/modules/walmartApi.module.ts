import { Module } from '@nestjs/common';
import { WalmartApiService } from 'src/services/walmartApi.service';
import { WalmartApiController } from 'src/controllers/walmartApi.controller';

@Module({
  providers: [WalmartApiService],
  controllers: [WalmartApiController],
  exports: [WalmartApiService]
})
export class WalmartApiModule {}
