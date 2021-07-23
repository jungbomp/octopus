import { Module } from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { ClockInModule } from './clockIn.module';
import { InventoriesModule } from './inventories.module';
import { ListingsModule } from './listings.module';
import { OrdersModule } from './orders.module';

@Module({
  imports: [ClockInModule, InventoriesModule, ListingsModule, OrdersModule],
  providers: [TasksService],
})
export class TasksModule {}