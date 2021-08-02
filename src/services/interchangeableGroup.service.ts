import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInterchangeableGroupDto } from '../models/dto/createInterchangeableGroup.dto';
import { InterchangeableGroup } from '../models/interchangeableGroup.entity';
import { InventoriesService } from './inventories.service';

@Injectable()
export class InterchangeableGroupsService {
  constructor(
    @InjectRepository(InterchangeableGroup)
    private readonly interchangeableGroupsRepository: Repository<InterchangeableGroup>,
    private readonly inventoiesService: InventoriesService,
  ) {}

  async findAll(): Promise<InterchangeableGroup[]> {
    return this.interchangeableGroupsRepository.find();
  }

  async find(stdSku: string): Promise<InterchangeableGroup> {
    const option = {
      inventory: { stdSku }
    };
    
    return this.interchangeableGroupsRepository.findOne({
      inventory: { stdSku }
    });
  }

  async create(createInterchangeableGroupDto: CreateInterchangeableGroupDto): Promise<InterchangeableGroup> {
    const inventory = await this.inventoiesService.findOne(createInterchangeableGroupDto.stdSku);
    const interchangeableGroupMap = CreateInterchangeableGroupDto.toInterchangeableGroup(createInterchangeableGroupDto, inventory);

    return this.interchangeableGroupsRepository.save(interchangeableGroupMap);
  }

  async remove(stdSku: string): Promise<void> {
    const option = {
      inventory: { stdSku }
    };
    
    await this.interchangeableGroupsRepository.delete({
      inventory: { stdSku }
    });
  }
}
