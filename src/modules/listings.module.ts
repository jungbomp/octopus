import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EbayApiModule } from './ebayApi.module';
import { InventoriesModule } from './inventories.module';
import { LogiwaApiModule } from './logiwaApi.module';
import { MarketsModule } from './markets.module';
import { OrdersModule } from './orders.module';
import { WalmartApiModule } from './walmartApi.module';

import { Listing } from '../models/listing.entity';
import { ListingsService } from '../services/listings.service';
import { ListingsController } from '../controllers/listings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Listing]), EbayApiModule, InventoriesModule, MarketsModule, LogiwaApiModule, OrdersModule, WalmartApiModule],
  providers: [ListingsService],
  exports: [ListingsService],
  controllers: [ListingsController],
})
export class ListingsModule {}
