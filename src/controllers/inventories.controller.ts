import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateInventoryDto } from '../models/dto/createInventory.dto';
import { UpdateInventoryDto } from '../models/dto/updateInventory.dto';
import { LogiwaInventoryitemSearchDto } from '../models/dto/logiwaInventoryItemSearch.dto';
import { Inventory } from '../models/inventory.entity';
import { InventoriesService } from '../services/inventories.service';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Get()
  findAll(): Promise<Inventory[]> {
    return this.inventoriesService.findAll();
  }

  @Get(':stdSku')
  findOne(@Param('stdSku') stdSku: string): Promise<Inventory> {
    return this.inventoriesService.findOne(stdSku);
  }

  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    return this.inventoriesService.create(createInventoryDto);
  }

  @Delete(':stdSku')
  remove(@Param('stdSku') stdSku: string): Promise<void> {
    return this.inventoriesService.remove(stdSku);
  }

  @Put(':stdSku')
  update(@Param('sstdSku') stdSku: string, @Body() updateInventoryDto: UpdateInventoryDto): Promise<any> {
    return this.inventoriesService.update(stdSku, updateInventoryDto);
  }

  @Post('logiwa/load-inventory-data-from-logiwa')
  loadInventoryDataFromLogiwa(@Body() logiwaInventoryItemSearchDto: LogiwaInventoryitemSearchDto): Promise<void> {
    return this.inventoriesService.loadInventoryDataFromLogiwa(logiwaInventoryItemSearchDto)
  }
}
