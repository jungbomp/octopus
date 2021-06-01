import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManufacturingMapDto } from '../models/dto/createManufacturingMap.dto';
import { ManufacturingMap } from '../models/manufacturingMap.entity';
import { Product } from '../models/product.entity';
import { Inventory } from '../models/inventory.entity';

@Injectable()
export class ManufacturingMapsService {
  constructor(
    @InjectRepository(ManufacturingMap)
    private readonly manufacturingMapsRepository: Repository<ManufacturingMap>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>
  ) {}

  async findAll(): Promise<ManufacturingMap[]> {
    return this.manufacturingMapsRepository.find();
  }

  async find(productCode: string, stdSku?: string): Promise<ManufacturingMap[]> {
    const option = {
      product: { productCode }
    };
    
    return this.manufacturingMapsRepository.find(stdSku ? {
      ...option,
      inventory: { stdSku }
    } : option);
  }

  async create(createManufacturingMapDto: CreateManufacturingMapDto): Promise<ManufacturingMap> {
    const product = await this.productRepository.findOne(createManufacturingMapDto.productCode);
    const inventory = await this.inventoryRepository.findOne(createManufacturingMapDto.stdSku);
    const manufacturingMap = CreateManufacturingMapDto.toManufacturingMapEntity(createManufacturingMapDto, product, inventory);

    return this.manufacturingMapsRepository.save(manufacturingMap);
  }

  async remove(productCode: string, stdSku: string): Promise<void> {
    const option = {
      product: { productCode }
    };
    
    await this.manufacturingMapsRepository.delete(stdSku ? {
      ...option,
      inventory: { stdSku }
    } : option);
  }
}
