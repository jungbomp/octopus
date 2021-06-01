import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ManufacturingMap } from '../models/manufacturingMap.entity';
import { CreateManufacturingMapDto } from '../models/dto/createManufacturingMap.dto';
import { ManufacturingMapsService } from '../services/manufacturingMaps.service';

@Controller('manufacturing-map')
export class ManufacturingMapsController {
  constructor(private readonly manufacturingMapsService: ManufacturingMapsService) {}

  @Get()
  findAll(): Promise<ManufacturingMap[]> {
    return this.manufacturingMapsService.findAll();
  }

  @Get(':productCode')
  find(@Param('productCode') productCode: string, @Query('stdSku') stdSku: string): Promise<ManufacturingMap[]> {
    return this.manufacturingMapsService.find(productCode, stdSku);
  }

  @Post()
  create(@Body() createManufacturingMapDto: CreateManufacturingMapDto): Promise<ManufacturingMap> {
    return this.manufacturingMapsService.create(createManufacturingMapDto);
  }

  @Delete(':productCode')
  remove(@Param('productCode') productCode: string, @Query('stdSku') stdSku: string): Promise<void> {
    return this.manufacturingMapsService.remove(productCode, stdSku);
  }
}
