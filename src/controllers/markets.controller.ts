import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateMarketDto } from '../models/dto/createMarket.dto';
import { UpdateMarketDto } from '../models/dto/updateMarket.dto';
import { Market } from '../models/market.entity';
import { MarketsService } from '../services/markets.service';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  findAll(): Promise<Market[]> {
    return this.marketsService.findAll();
  }

  @Get(':marketId')
  findOne(@Param('marketId') marketId: number): Promise<Market> {
    return this.marketsService.findOne(marketId);
  }

  @Post()
  create(@Body() createMarketDto: CreateMarketDto): Promise<Market> {
    return this.marketsService.create(createMarketDto);
  }

  @Delete(':marketId')
  remove(@Param('marketId') marketId: number): Promise<void> {
    return this.marketsService.remove(marketId);
  }

  @Put(':marketId')
  update(@Param('marketId') marketId: number, @Body() updateMarketDto: UpdateMarketDto): Promise<void> {
    return this.marketsService.update(marketId, updateMarketDto);
  }
}
