import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateStdSizeDto } from '../models/dto/createStdSize.dto';
import { UpdateStdSizeDto } from '../models/dto/updateStdSize.dto';
import { StdSize } from '../models/stdSize.entity';
import { StdSizesService } from '../services/stdSizes.service';

@Controller('std-sizes')
export class StdSizesController {
  constructor(private readonly stdSizesService: StdSizesService) {}

  @Get()
  findAll(): Promise<StdSize[]> {
    return this.stdSizesService.findAll();
  }

  @Get(':sizeCode')
  findOne(@Param('sizeCode') sizeCode: string): Promise<StdSize> {
    return this.stdSizesService.findOne(sizeCode);
  }

  @Post()
  create(@Body() createStdSizeDto: CreateStdSizeDto): Promise<StdSize> {
    return this.stdSizesService.create(createStdSizeDto);
  }

  @Delete(':sizeCode')
  remove(@Param('sizeCode') sizeCode: string): Promise<void> {
    return this.stdSizesService.remove(sizeCode);
  }

  @Put(':sizeCode')
  update(@Param('sizeCode') sizeCode: string, @Body() updateStdSizeDto: UpdateStdSizeDto): Promise<void> {
    return this.stdSizesService.update(sizeCode, updateStdSizeDto);
  }
}
