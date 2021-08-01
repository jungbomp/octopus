import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CreateInterchangeableGroupMapDto } from '../models/dto/createInterchangeableGroupMap.dto';
import { InterchangeableGroupMap } from '../models/interchangeableGroupMap.entity';
import { InterchangeableGroupMapsService } from '../services/interchangeableGroupMaps.service';

@Controller('interchangeable-group-map')
export class InterchangeableGroupMapsController {
  constructor(private readonly interchangeableGroupMapsService: InterchangeableGroupMapsService) {}

  @Get()
  findAll(): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupMapsService.findAll();
  }

  @Get(':interchangeableKeySku/:stdSku?')
  find(@Param('interchangeableKeySku') interchangeableKeySku: string, @Param('stdSku') stdSku?: string): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupMapsService.find(interchangeableKeySku, stdSku);
  }

  @Post()
  create(@Body() createInterchangeableGroupMapDto: CreateInterchangeableGroupMapDto): Promise<InterchangeableGroupMap> {
    return this.interchangeableGroupMapsService.create(createInterchangeableGroupMapDto);
  }

  @Delete(':interchangeableKeySku/:stdSku?')
  remove(@Param('interchangeableKeySku') interchangeableKeySku: string, @Query('stdSku') stdSku?: string): Promise<void> {
    return this.interchangeableGroupMapsService.remove(interchangeableKeySku, stdSku);
  }
}
