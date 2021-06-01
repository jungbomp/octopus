import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ProductMap } from '../models/productMap.entity';
import { CreateProductMapDto } from '../models/dto/createProductMap.dto';
import { ProductMapsService } from '../services/productMaps.service';
import { ProductMapProduct } from '../models/dto/productMapProduct.dto';

@Controller('product-map')
export class ProductMapsController {
  constructor(private readonly productMapsService: ProductMapsService) {}

  @Get()
  findAll(): Promise<ProductMap[]> {
    return this.productMapsService.findAll();
  }

  @Get('mapping-products')
  findAllMappingProducts(): Promise<ProductMapProduct[]> {
    return this.productMapsService.findMappingProducts();
  }

  @Get(':productCode')
  find(@Param('productCode') productCode: string, @Query('stdSku') stdSku: string): Promise<ProductMap[]> {
    return this.productMapsService.find(productCode, stdSku);
  }

  @Get(':productCode/mapping-products')
  findMappingProducts(@Param('productCode') productCode: string, @Query('stdSku') stdSku: string): Promise<ProductMapProduct[]> {
    return this.productMapsService.findMappingProducts(productCode, stdSku);
  }

  @Post()
  create(@Body() createProductMapDto: CreateProductMapDto): Promise<ProductMap> {
    return this.productMapsService.create(createProductMapDto);
  }

  @Delete(':productCode')
  remove(@Param('productCode') productCode: string, @Query('stdSku') stdSku: string): Promise<void> {
    return this.productMapsService.remove(productCode, stdSku);
  }
}
