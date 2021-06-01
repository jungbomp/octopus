import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from '../models/market.entity';
import { MarketsController } from '../controllers/markets.controller';
import { MarketsService } from '../services/markets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Market])],
  providers: [MarketsService],
  exports: [MarketsService],
  controllers: [MarketsController],
})
export class MarketsModule {}
