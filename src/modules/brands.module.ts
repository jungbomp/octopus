import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '../models/brand.entity';
import { BrandsController } from '../controllers/brands.controller';
import { BrandsService } from '../services/brands.service';

@Module({
  imports: [TypeOrmModule.forFeature([Brand])],
  providers: [BrandsService],
  exports: [BrandsService],
  controllers: [BrandsController],
})
export class BrandsModule {}
