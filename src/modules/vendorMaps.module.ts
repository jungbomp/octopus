import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from './brands.module';
import { ProductsModule } from './products.module';
import { VendorsModule } from './vendors.module';

import { VendorMapsController } from '../controllers/vendorMaps.controller';
import { VendorMapsService } from '../services/vendorMaps.service';
import { VendorMap } from '../models/vendorMap.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VendorMap]), BrandsModule, ProductsModule, VendorsModule],
  providers: [VendorMapsService],
  controllers: [VendorMapsController],
  exports: [VendorMapsService]
})
export class VendorMapsModule {}
