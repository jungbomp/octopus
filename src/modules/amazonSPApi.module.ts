import { Module } from '@nestjs/common';
import { AmazonSPApiService } from 'src/services/amazonSPApi.service';
import { AmazonSPApiController } from 'src/controllers/amazonSPApi.controller';

@Module({
  providers: [AmazonSPApiService],
  controllers: [AmazonSPApiController],
  exports: [AmazonSPApiService]
})
export class AmazonSPApiModule {}
