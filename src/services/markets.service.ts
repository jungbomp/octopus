import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMarketDto } from '../models/dto/createMarket.dto';
import { UpdateMarketDto } from '../models/dto/updateMarket.dto';
import { Market } from '../models/market.entity';

@Injectable()
export class MarketsService {
  constructor(
    @InjectRepository(Market)
    private readonly marketsRepository: Repository<Market>,
  ) {}

  create(createMarketDto: CreateMarketDto): Promise<Market> {
    const market = CreateMarketDto.toMarketEntity(createMarketDto);

    return this.marketsRepository.save(market);
  }

  async findAll(): Promise<Market[]> {
    return this.marketsRepository.find();
  }

  findOne(marketId: number): Promise<Market> {
    return this.marketsRepository.findOne(marketId);
  }

  async remove(marketId: number): Promise<void> {
    await this.marketsRepository.delete(marketId);
  }

  async update(marketId: number, updateMarketDto: UpdateMarketDto): Promise<void> {
    const market = UpdateMarketDto.toMarketEntity(updateMarketDto);
      
    await this.marketsRepository.update(marketId, market);
  }
}
