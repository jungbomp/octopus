import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClockIn } from '../models/clockIn.entity';
import { ClockInController } from '../controllers/clockIn.controller';
import { ClockInService } from '../services/clockIn.service';
import { GoogleApiService } from '../services/googleApi.service';
import { DateTimeUtil } from '../utils/dateTime.util';

@Module({
  imports: [TypeOrmModule.forFeature([ClockIn])],
  providers: [ClockInService, GoogleApiService, DateTimeUtil],
  exports: [ClockInService],
  controllers: [ClockInController],
})
export class ClockInModule {}
