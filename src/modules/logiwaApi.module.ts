import { Module } from '@nestjs/common';
import { LogiwaService } from 'src/services/logiwa.service';
import { LogiwaApiController } from 'src/controllers/logiwaApi.controller';

@Module({
  providers: [LogiwaService],
  controllers: [LogiwaApiController],
  exports: [LogiwaService]
})
export class LogiwaApiModule {}
