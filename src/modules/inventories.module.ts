import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogiwaApiModule } from './logiwaApi.module';
import { ProductsModule } from './products.module';
import { StdSizesModule } from './stdSizes.module';

import { InventoriesController } from '../controllers/inventories.controller';
import { Inventory } from '../models/inventory.entity';
import { InventoriesService } from '../services/inventories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory]), LogiwaApiModule, ProductsModule, StdSizesModule],
  providers: [InventoriesService],
  exports: [InventoriesService],
  controllers: [InventoriesController],
})
export class InventoriesModule {}
