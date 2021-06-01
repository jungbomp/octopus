import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateVendorDto } from '../models/dto/createVendor.dto';
import { UpdateVendorDto } from '../models/dto/updateVendor.dto';
import { Vendor } from '../models/vendor.entity';
import { VendorsService } from '../services/vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll(): Promise<Vendor[]> {
    return this.vendorsService.findAll();
  }

  @Get(':vendorCode')
  findOne(@Param('vendorCode') vendorCode: string): Promise<Vendor> {
    return this.vendorsService.findOne(vendorCode);
  }

  @Post()
  create(@Body() createVendorDto: CreateVendorDto): Promise<Vendor> {
    return this.vendorsService.create(createVendorDto);
  }

  @Delete(':vendorCode')
  remove(@Param('vendorCode') vendorCode: string): Promise<void> {
    return this.vendorsService.remove(vendorCode);
  }

  @Put(':vendorCode')
  update(@Param('vendorCode') vendorCode: string, @Body() updateVendorDto: UpdateVendorDto): Promise<void> {
    return this.vendorsService.update(vendorCode, updateVendorDto);
  }
}
