import { Module } from '@nestjs/common';
import { SearsApiService } from 'src/services/searsApi.service';
import { SearsApiController } from 'src/controllers/searsApi.controller';

@Module({
  providers: [SearsApiService],
  controllers: [SearsApiController],
  exports: [SearsApiService],
})
export class SearsApiModule {}
