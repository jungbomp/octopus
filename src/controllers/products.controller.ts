import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateProductDto } from '../models/dto/createProduct.dto';
import { UpdateProductDto } from '../models/dto/updateProduct.dto';
import { Product } from '../models/product.entity';
import { ProductsService } from '../services/products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('includeManufacturing') includeManufacturing: string, @Query('brandCode') brandCode: string): Promise<Product[]> {
    console.log('includeManufacturing: ', includeManufacturing);
    return this.productsService.findAll((/true/i).test(includeManufacturing), brandCode);
  }

  @Get(':productCode')
  findOne(@Param('productCode') productCode: string, @Query('includeManufacturing') includeManufacturing: string): Promise<Product> {
    return this.productsService.findOne(productCode, (/true/i).test(includeManufacturing));
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Delete(':productCode')
  remove(@Param('productCode') productCode: string): Promise<void> {
    return this.productsService.remove(productCode);
  }

  @Put(':productCode')
  update(@Param('productCode') productCode: string, @Body() updateProductDto: UpdateProductDto): Promise<void> {
    return this.productsService.update(productCode, updateProductDto);
  }
}
