import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManufacturingMapsController } from '../controllers/manufacturingMaps.controller';
import { ManufacturingMapsService } from '../services/manufacturingMaps.service';
import { Product } from '../models/product.entity';
import { ManufacturingMap } from '../models/manufacturingMap.entity';
import { Inventory } from '../models/inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ManufacturingMap, Product, Inventory])],
  providers: [ManufacturingMapsService],
  exports: [ManufacturingMapsService],
  controllers: [ManufacturingMapsController],
})
export class ManufacturingMapsModule {}
