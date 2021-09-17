import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInterchangeableGroupDto } from '../models/dto/createInterchangeableGroup.dto';
import { CreateInterchangeableGroupMapDto } from '../models/dto/createInterchangeableGroupMap.dto';
import { InterchangeableGroup } from '../models/interchangeableGroup.entity';
import { InterchangeableGroupMap } from '../models/interchangeableGroupMap.entity';
import { Inventory } from '../models/inventory.entity';
import { InventoriesService } from './inventories.service';

@Injectable()
export class InterchangeableGroupsService {
  private readonly logger = new Logger(InterchangeableGroupsService.name);

  constructor(
    @InjectRepository(InterchangeableGroup)
    private readonly interchangeableGroupsRepository: Repository<InterchangeableGroup>,
    @InjectRepository(InterchangeableGroupMap)
    private readonly interchangeableGroupMapsRepository: Repository<InterchangeableGroupMap>,
    private readonly inventoriesService: InventoriesService,
  ) {}

  async findAll(): Promise<InterchangeableGroup[]> {
    return this.interchangeableGroupsRepository.find();
  }

  async findAllMappings(): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupMapsRepository.find({ relations: ['interchangeableGroup'] });
  }

  async find(stdSku: string): Promise<InterchangeableGroup> {
    return this.interchangeableGroupsRepository.findOne({
      inventory: { stdSku }
    });
  }

  async findMappings(interchangeableGroupStdSku: string): Promise<InterchangeableGroupMap[]> {
    return this.interchangeableGroupMapsRepository.find({
      relations: ['interchangeableGroup'],
      where: {
        interchangeableGroup: {
          inventory: {
            stdSku: interchangeableGroupStdSku
          },
        }
      }
    });
  }

  async findMapping(interchangeableGroupStdSku: string, stdSku: string): Promise<InterchangeableGroupMap> {
    return this.interchangeableGroupMapsRepository.findOne({
      relations: ['interchangeableGroup'],
      where: {
        interchangeableGroup: {
          inventory: {
            stdSku: interchangeableGroupStdSku
          },
        },
        inventory: { stdSku }
      }
    });
  }

  async findMappingByStdSku(stdSku: string): Promise<InterchangeableGroupMap | undefined> {
    const interchangeableGroupMaps: InterchangeableGroupMap[] = await this.interchangeableGroupMapsRepository.find({
      relations: ['interchangeableGroup'],
      where: {
        inventory: {
          stdSku: stdSku
        },
      }
    });


    return interchangeableGroupMaps.shift();
  }

  async create(createInterchangeableGroupDto: CreateInterchangeableGroupDto): Promise<InterchangeableGroup> {
    const inventory = await this.inventoriesService.findOne(createInterchangeableGroupDto.stdSku);
    const interchangeableGroup = CreateInterchangeableGroupDto.toInterchangeableGroup(createInterchangeableGroupDto, inventory);

    return this.interchangeableGroupsRepository.save(interchangeableGroup);
  }

  async createBatch(createInterchangeableGroups: CreateInterchangeableGroupDto[]): Promise<InterchangeableGroup[]> {
    const interchangeableGroups: InterchangeableGroup[] = createInterchangeableGroups.map((dto: CreateInterchangeableGroupDto): InterchangeableGroup => {
      const inventory = new Inventory();
      inventory.stdSku = dto.stdSku;
      return CreateInterchangeableGroupDto.toInterchangeableGroup(dto, dto.stdSku ? inventory : undefined);
    });

    return this.interchangeableGroupsRepository.save(interchangeableGroups);
  }

  async createMapping(createInterchangeableGroupMapDto: CreateInterchangeableGroupMapDto): Promise<InterchangeableGroupMap> {
    const interchangeableGroup = await this.find(createInterchangeableGroupMapDto.interchangeableGroupStdSku);
    const inventory = await this.inventoriesService.findOne(createInterchangeableGroupMapDto.stdSku);
    const interchangeableGroupMap = CreateInterchangeableGroupMapDto.toInterchangeableGroupMap(interchangeableGroup, inventory);

    return this.interchangeableGroupMapsRepository.save(interchangeableGroupMap);
  }

  async createMappingBatch(createInterchangeableGroupMaps: CreateInterchangeableGroupMapDto[]): Promise<InterchangeableGroupMap[]> {
    const interchangeableGroupMaps: InterchangeableGroupMap[] = createInterchangeableGroupMaps.map((dto: CreateInterchangeableGroupMapDto): InterchangeableGroupMap => {
      const interchangeableGroup = new InterchangeableGroup();
      interchangeableGroup.inventory.stdSku = dto.interchangeableGroupStdSku;

      const inventory = new Inventory();
      inventory.stdSku = dto.stdSku;
      return CreateInterchangeableGroupMapDto.toInterchangeableGroupMap(interchangeableGroup, inventory);
    });

    return this.interchangeableGroupMapsRepository.save(interchangeableGroupMaps);
  }

  async remove(stdSku: string): Promise<void> {
    await this.interchangeableGroupsRepository.delete({
      inventory: { stdSku }
    });
  }

  async removeMappings(interchangeableGroupStdSku: string, stdSku?: string): Promise<void> {
    const option = {
      interchangeableGroup: {
        inventory: { stdSku: interchangeableGroupStdSku }
      }
    }

    await this.interchangeableGroupMapsRepository.delete(stdSku ? 
      {
        ...option,
        inventory: { stdSku }
      } : option);
  }

  async updateInterchangeableQuantities(): Promise<void> {
    this.logger.log('Update InterchangeableGroup');

    const interchangeableGroups = await this.findAll();

    const createInterchangeableGroupDtos = await Promise.all(interchangeableGroups.map(
      async (interchangeableGroup: InterchangeableGroup): Promise<CreateInterchangeableGroupDto> => {
        const interchangeableGroupMaps = await this.findMappings(interchangeableGroup.inventory.stdSku);
        
        const createInterchangeableGroupDto = new CreateInterchangeableGroupDto();
        createInterchangeableGroupDto.stdSku = interchangeableGroup.inventory.stdSku;
        createInterchangeableGroupDto.quantity = interchangeableGroupMaps.reduce(
          (sum: number, interchangeableGroupMap: InterchangeableGroupMap): number => sum + interchangeableGroupMap.inventory.productQty,
          0
        );

        return createInterchangeableGroupDto;
      })
    );

    await this.createBatch(createInterchangeableGroupDtos);
    this.logger.log('Updated InterchangeableGroup quantities');
  }
}
