import { Module } from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { ClockInModule } from './clockIn.module';
import { InterchangeableGroupsModule } from './interchangeableGroups.module';
import { InventoriesModule } from './inventories.module';
import { ListingsModule } from './listings.module';
import { LogiwaApiModule } from './logiwaApi.module';
import { OrdersModule } from './orders.module';
import { ProductBundlesModule } from './productBundles.module';

@Module({
  imports: [ClockInModule, InterchangeableGroupsModule, InventoriesModule, ListingsModule, LogiwaApiModule, OrdersModule, ProductBundlesModule],
  providers: [TasksService],
})
export class TasksModule {}