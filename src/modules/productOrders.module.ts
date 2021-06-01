import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BrandsModule } from './brands.module';
import { UsersModule } from './users.module';
import { ManufacturingMapsModule } from './manufacturingMaps.module';
import { InventoriesModule } from './inventories.module';
import { ProductsModule } from './products.module';
import { ProductMapsModule } from './productMaps.module';
import { VendorsModule } from './vendors.module';

import { ProductOrdersController } from '../controllers/productOrders.controller';
import { ProductOrder } from '../models/productOrder.entity';
import { GoogleApiService } from '../services/googleApi.service';
import { LogiwaService } from '../services/logiwa.service';
import { ProductOrdersService } from '../services/productOrders.service';
import { SendGridService } from '../services/sendGrid.service';
import { DateTimeUtil } from '../utils/dateTime.util';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrder]), BrandsModule, InventoriesModule, ManufacturingMapsModule, ProductsModule, ProductMapsModule, UsersModule, VendorsModule],
  providers: [ProductOrdersService, GoogleApiService, LogiwaService, SendGridService, DateTimeUtil],
  exports: [ProductOrdersService],
  controllers: [ProductOrdersController],
})
export class ProductOrdersModule {}
