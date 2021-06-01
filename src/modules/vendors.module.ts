import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from '../models/vendor.entity';
import { VendorsController } from '../controllers/vendors.controller';
import { VendorsService } from '../services/vendors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor])],
  providers: [VendorsService],
  controllers: [VendorsController],
  exports: [VendorsService]
})
export class VendorsModule {}
