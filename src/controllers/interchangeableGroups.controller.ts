import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateInterchangeableGroupDto } from '../models/dto/createInterchangeableGroup.dto';
import { InterchangeableGroup } from '../models/interchangeableGroup.entity';
import { InterchangeableGroupsService } from '../services/interchangeableGroup.service';

@Controller('interchangeable-group')
export class InterchangeableGroupsController {
  constructor(private readonly interchangeableGroupsService: InterchangeableGroupsService) {}

  @Get()
  findAll(): Promise<InterchangeableGroup[]> {
    return this.interchangeableGroupsService.findAll();
  }

  @Get(':stdSku')
  find(@Param('stdSku') stdSku: string): Promise<InterchangeableGroup> {
    return this.interchangeableGroupsService.find(stdSku);
  }

  @Post()
  create(@Body() createInterchangeableGroupDto: CreateInterchangeableGroupDto): Promise<InterchangeableGroup> {
    return this.interchangeableGroupsService.create(createInterchangeableGroupDto);
  }

  @Delete(':stdSku')
  remove(@Param('stdSku') stdSku: string): Promise<void> {
    return this.interchangeableGroupsService.remove(stdSku);
  }
}
