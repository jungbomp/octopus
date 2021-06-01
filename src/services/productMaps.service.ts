import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductMapProduct } from '../models/dto/productMapProduct.dto';
import { Repository } from 'typeorm';
import { CreateProductMapDto } from '../models/dto/createProductMap.dto';
import { ProductMap } from '../models/productMap.entity';
import { InventoriesService } from './inventories.service';
import { ProductsService } from './products.service';

@Injectable()
export class ProductMapsService {
  constructor(
    @InjectRepository(ProductMap)
    private readonly productMapsRepository: Repository<ProductMap>,
    private readonly inventoriesService: InventoriesService,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(): Promise<ProductMap[]> {
    return this.productMapsRepository.find();
  }

  async find(productCode: string, stdSku?: string): Promise<ProductMap[]> {
    const option = {
      product: { productCode }
    };
    
    return this.productMapsRepository.find(stdSku ? {
      ...option,
      inventory: { stdSku }
    } : option);
  }

  async findMappingProducts(productCode?: string, stdSku?: string): Promise<ProductMapProduct[]> {
    const productMaps = await ((productCode || null) === null ?  this.findAll() : this.find(productCode, stdSku));

    return productMaps
      .map(productMap => new ProductMapProduct(
          productMap.product.productCode,
          productMap.inventory.stdSku,
          productMap.inventory.productColor.lastIndexOf('_') > 0 ?
            productMap.inventory.productColor.substring(productMap.inventory.productColor.lastIndexOf('_') + 1)
            : productMap.inventory.productColor,
          productMap.inventory.stdSize.sizeCode,
          productMap.inventory.stdSize.shortSizeCode,
          productMap.inventory.stdSize.sizeOrder));
  }

  async create(createProductMapDto: CreateProductMapDto): Promise<ProductMap> {
    const product = await this.productsService.findOne(createProductMapDto.productCode, false);
    const inventory = await this.inventoriesService.findOne(createProductMapDto.stdSku);
    const productMap = CreateProductMapDto.toProductMapEntity(createProductMapDto, product, inventory);

    return this.productMapsRepository.save(productMap);
  }

  async remove(productCode: string, stdSku: string): Promise<void> {
    const option = {
      product: { productCode }
    };
    
    await this.productMapsRepository.delete(stdSku ? {
      ...option,
      inventory: { stdSku }
    } : option);
  }
}
