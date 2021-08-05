import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { InterchangeableGroup } from '../models/interchangeableGroup.entity';
import { InterchangeableGroupMap } from '../models/interchangeableGroupMap.entity';
import { CreateInterchangeableGroupDto } from '../models/dto/createInterchangeableGroup.dto';
import { CreateInterchangeableGroupMapDto } from '../models/dto/createInterchangeableGroupMap.dto';
import { InterchangeableGroupsService } from '../services/interchangeableGroups.service';

@Controller('interchangeable-group')
export class InterchangeableGroupsController {
  constructor(private readonly interchangeableGroupsService: InterchangeableGroupsService) {}

  @Get()
  findAll(): Promise<InterchangeableGroup[]> {
    return this.interchangeableGroupsService.findAll();
  }

  @Get('mappings')
  findAllMappings(): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupsService.findAllMappings();
  }

  @Get(':stdSku')
  find(@Param('stdSku') stdSku: string): Promise<InterchangeableGroup> {
    return this.interchangeableGroupsService.find(stdSku);
  }

  @Get(':interchangeableGroupStdSku/mappings')
  findMappings(@Param('interchangeableGroupStdSku') interchangeableGroupStdSku: string): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupsService.findMappings(interchangeableGroupStdSku);
  }

  @Get(':interchangeableGroupStdSku/mappings/:stdSku')
  findMapping(@Param('interchangeableGroupStdSku') interchangeableGroupStdSku: string, @Param('stdSku') stdSku: string): Promise<InterchangeableGroupMap> {
    return this.interchangeableGroupsService.findMapping(interchangeableGroupStdSku, stdSku);
  }

  @Get('mappings/:stdSku')
  findMappingsByStdSku(@Param('stdSku') stdSku: string): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupsService.findMappingsByStdSku(stdSku);
  }

  @Post()
  create(@Body() createInterchangeableGroupDto: CreateInterchangeableGroupDto): Promise<InterchangeableGroup> {
    return this.interchangeableGroupsService.create(createInterchangeableGroupDto);
  }

  @Post('mapping')
  createMapping(@Body() createInterchangeableGroupMapDto: CreateInterchangeableGroupMapDto): Promise<InterchangeableGroupMap> {
    return this.interchangeableGroupsService.createMapping(createInterchangeableGroupMapDto);
  }

  @Post('mappings')
  createMappings(@Body() createInterchangeableGroupMapDtos: CreateInterchangeableGroupMapDto[]): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupsService.createMappingBatch(createInterchangeableGroupMapDtos);
  }

  @Delete(':stdSku')
  remove(@Param('stdSku') stdSku: string): Promise<void> {
    return this.interchangeableGroupsService.remove(stdSku);
  }

  @Delete(':interchangeableGroupStdSku/mappings/:stdSku?')
  deleteMappings(@Param('interchangeableGroupStdSku') interchangeableGroupStdSku: string, @Param('stdSku') stdSku?: string) {
    return this.interchangeableGroupsService.removeMappings(interchangeableGroupStdSku, stdSku);
  }

  @Put('update-interchangeable-quantities')
  updateInterchangeableQuantities() {
    this.interchangeableGroupsService.updateInterchangeableQuantities();
  }
}
