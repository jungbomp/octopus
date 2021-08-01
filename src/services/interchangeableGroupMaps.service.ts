import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInterchangeableGroupMapDto } from '../models/dto/createInterchangeableGroupMap.dto';
import { InterchangeableGroupMap } from '../models/interchangeableGroupMap.entity';
import { InventoriesService } from './inventories.service';

@Injectable()
export class InterchangeableGroupMapsService {
  constructor(
    @InjectRepository(InterchangeableGroupMap)
    private readonly interchangeableGroupMapsRepository: Repository<InterchangeableGroupMap>,
    private readonly inventoiesService: InventoriesService,
  ) {}

  async findAll(): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupMapsRepository.find();
  }

  async find(interchangeableKeySku: string, stdSku?: string): Promise<InterchangeableGroupMap[]> {
    const option = {
      interchangeableKey: { stdSku: interchangeableKeySku }
    };
    
    return this.interchangeableGroupMapsRepository.find(stdSku ? {
      ...option,
      inventory: { stdSku }
    } : option);
  }

  async create(createInterchangeableGroupMapDto: CreateInterchangeableGroupMapDto): Promise<InterchangeableGroupMap> {
    const interchangeableKey = await this.inventoiesService.findOne(createInterchangeableGroupMapDto.interchangeableKeySku);
    const inventory = await this.inventoiesService.findOne(createInterchangeableGroupMapDto.stdSku);
    const interchangeableGroupMap = CreateInterchangeableGroupMapDto.toInterchangeableGroupMap(interchangeableKey, inventory);

    return this.interchangeableGroupMapsRepository.save(interchangeableGroupMap);
  }

  async remove(interchangeableKeySku: string, stdSku?: string): Promise<void> {
    const option = {
      interchangeableKey: { stdSku: interchangeableKeySku }
    };
    
    await this.interchangeableGroupMapsRepository.delete(stdSku ? {
      ...option,
      inventory: { stdSku }
    } : option);
  }
}
