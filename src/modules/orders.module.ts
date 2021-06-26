import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AmazonSPApiModule } from './amazonSPApi.module';
import { InventoriesModule } from './inventories.module';
import { LogiwaApiModule } from './logiwaApi.module';
import { MarketsModule } from './markets.module';
import { UsersModule } from './users.module';
import { WalmartApiModule } from './walmartApi.module';

import { OrderItem } from '../models/orderItem.entity';
import { Orders } from '../models/orders.entity';

import { EbayApiService } from '../services/ebayApi.service';
import { OrdersService } from '../services/orders.service';

import { OrdersController } from '../controllers/orders.controller';
import { DateTimeUtil } from '../utils/dateTime.util';

@Module({
  imports: [TypeOrmModule.forFeature([Orders, OrderItem]), AmazonSPApiModule, InventoriesModule, LogiwaApiModule, MarketsModule, UsersModule, WalmartApiModule],
  providers: [OrdersService, EbayApiService, DateTimeUtil],
  exports: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
