import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { VendorMap } from '../models/vendorMap.entity';
import { CreateVendorMapDto } from '../models/dto/createVendorMap.dto';
import { VendorMapsService } from '../services/vendorMaps.service';
import { VendorMapProduct } from 'src/models/dto/vendorMapProduct.dto';

@Controller('vendor-map')
export class VendorMapsController {
  constructor(private readonly vendorMapsService: VendorMapsService) {}

  @Get()
  findAll(): Promise<VendorMap[]> {
    
    return this.vendorMapsService.findAll();
  }

  @Get('mapping-products')
  findAllMappingProducts(@Query('brandCode') brandCode: string): Promise<VendorMapProduct[]> {
    return this.vendorMapsService.findMappingProducts('', brandCode);
  }

  @Get(':vendorCode')
  find(@Param('vendorCode') vendorCode: string, @Query('brandCode') brandCode: string): Promise<VendorMap[]> {
    return this.vendorMapsService.find(vendorCode, brandCode);
  }

  @Get(':vendorCode/mapping-products')
  findMappingProducts(@Param('vendorCode') vendorCode: string, @Query('brandCode') brandCode: string): Promise<VendorMapProduct[]> {
    return this.vendorMapsService.findMappingProducts(vendorCode, brandCode);
  }

  @Post()
  create(@Body() createVendorMapDto: CreateVendorMapDto): Promise<VendorMap> {
    return this.vendorMapsService.create(createVendorMapDto);
  }

  @Delete(':vendorCode')
  remove(@Param('vendorCode') vendorCode: string, @Query('brandCode') brandCode: string): Promise<void> {
    return this.vendorMapsService.remove(vendorCode, brandCode);
  }
}
