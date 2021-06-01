import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from '../controllers/products.controller';
import { Product } from '../models/product.entity';
import { ProductsService } from '../services/products.service';
import { BrandsModule } from './brands.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), BrandsModule],
  providers: [ProductsService],
  exports: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
