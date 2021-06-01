import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateBrandDto } from '../models/dto/createBrand.dto';
import { UpdateBrandDto } from '../models/dto/updateBrand.dto';
import { Brand } from '../models/brand.entity';
import { BrandsService } from '../services/brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll(@Query('hasProduct') hasProduct: boolean): Promise<Brand[]> {
    return this.brandsService.findAll(hasProduct);
  }

  @Get(':brandCode')
  findOne(@Param('brandCode') brandCode: string): Promise<Brand> {
    return this.brandsService.findOne(brandCode);
  }

  @Post()
  create(@Body() createBrandDto: CreateBrandDto): Promise<Brand> {
    return this.brandsService.create(createBrandDto);
  }

  @Delete(':brandCode')
  remove(@Param('brandCode') brandCode: string): Promise<void> {
    return this.brandsService.remove(brandCode);
  }

  @Put(':idbrandCode')
  update(@Param('brandCode') brandCode: string, @Body() updateBrandDto: UpdateBrandDto): Promise<void> {
    return this.brandsService.update(brandCode, updateBrandDto);
  }
}
