import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoriesModule } from './inventories.module';
import { InterchangeableGroupMap } from '../models/interchangeableGroupMap.entity';
import { InterchangeableGroupMapsController } from '../controllers/interchangeableGroupMaps.controller';
import { InterchangeableGroupMapsService } from '../services/interchangeableGroupMaps.service';

@Module({
  imports: [TypeOrmModule.forFeature([InterchangeableGroupMap]), InventoriesModule],
  providers: [InterchangeableGroupMapsService],
  exports: [InterchangeableGroupMapsService],
  controllers: [InterchangeableGroupMapsController],
})
export class InterchangeableGroupMapsModule {}
