import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMapsController } from '../controllers/productMaps.controller';
import { ProductMapsService } from '../services/productMaps.service';
import { ProductMap } from '../models/productMap.entity';
import { ProductsModule } from './products.module';
import { InventoriesModule } from './inventories.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductMap]), ProductsModule, InventoriesModule],
  providers: [ProductMapsService],
  exports: [ProductMapsService],
  controllers: [ProductMapsController],
})
export class ProductMapsModule {}
