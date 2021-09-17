import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ProductBundle } from '../models/productBundle.entity';
import { CreateProductBundleDto } from '../models/dto/createProductBundle.dto';
import { ProductBundlesService } from '../services/productBundles.service';

@Controller('product-bundle')
export class ProductBundlesController {
  constructor(private readonly productBundlesService: ProductBundlesService) {}

  @Get()
  findAll(): Promise<ProductBundle[]> {
    return this.productBundlesService.findAll();
  }

  @Get(':bundleStdSku')
  find(@Param('bundleStdSku') bundleStdSku: string, @Query('stdSku') stdSku: string): Promise<ProductBundle[]> {
    return this.productBundlesService.find(bundleStdSku, stdSku);
  }

  @Get(':bundleStdSku/quantity')
  getProductBundleQuantity(@Param('bundleStdSku') bundleStdSku: string): Promise<number> {
    return this.productBundlesService.getProductBundleQuantity(bundleStdSku);
  }

  @Put(':bundleStdSku/quantity')
  updateProductBundleQuantity(@Param('bundleStdSku') bundleStdSku: string): Promise<void> {
    return this.productBundlesService.updateProductBundleQuantity(bundleStdSku);
  }

  @Put('quantities')
  updateAllProductBundleQuantity(): Promise<void> {
    return this.productBundlesService.updateAllProductBundleQuantity();
  }

  @Post()
  create(@Body() createProductBundleDto: CreateProductBundleDto): Promise<ProductBundle> {
    return this.productBundlesService.create(createProductBundleDto);
  }

  @Delete(':bundleStdSku')
  remove(@Param('bundleStdSku') bundleStdSku: string, @Query('stdSku') stdSku?: string): Promise<void> {
    return this.productBundlesService.remove(bundleStdSku, stdSku);
  }
}
