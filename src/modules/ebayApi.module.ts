import { Module } from '@nestjs/common';
import { EbayApiService } from 'src/services/ebayApi.service';
import { EbayApiController } from 'src/controllers/ebayApi.controller';

@Module({
  providers: [EbayApiService],
  controllers: [EbayApiController],
  exports: [EbayApiService]
})
export class EbayApiModule {}
