import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoriesModule } from './inventories.module';
import { InterchangeableGroup } from '../models/interchangeableGroup.entity';
import { InterchangeableGroupMap } from '../models/interchangeableGroupMap.entity';
import { InterchangeableGroupsController } from '../controllers/interchangeableGroups.controller';
import { InterchangeableGroupsService } from '../services/interchangeableGroups.service';

@Module({
  imports: [TypeOrmModule.forFeature([InterchangeableGroup, InterchangeableGroupMap]), InventoriesModule],
  providers: [InterchangeableGroupsService],
  exports: [InterchangeableGroupsService],
  controllers: [InterchangeableGroupsController],
})
export class InterchangeableGroupsModule {}
