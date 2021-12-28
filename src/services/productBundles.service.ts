import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateInventoryDto } from 'src/models/dto/createInventory.dto';
import { CreateProductBundleDto } from 'src/models/dto/createProductBundle.dto';
import { InterchangeableGroupMap } from 'src/models/interchangeableGroupMap.entity';
import { ProductBundle } from 'src/models/productBundle.entity';
import { Repository } from 'typeorm';
import { InterchangeableGroupsService } from './interchangeableGroups.service';
import { InventoriesService } from './inventories.service';

@Injectable()
export class ProductBundlesService {
  private readonly logger = new Logger(ProductBundlesService.name);

  constructor(
    @InjectRepository(ProductBundle)
    private readonly productBundlesRepository: Repository<ProductBundle>,
    private readonly interchangeableGroupsService: InterchangeableGroupsService,
    private readonly inventoriesService: InventoriesService,
  ) {}

  async findAll(): Promise<ProductBundle[]> {
    return this.productBundlesRepository.find();
  }

  async find(bundleStdSku: string, stdSku?: string): Promise<ProductBundle[]> {
    const option = {
      bundle: { stdSku: bundleStdSku },
    };

    return this.productBundlesRepository.find(
      stdSku
        ? {
            ...option,
            inventory: { stdSku },
          }
        : option,
    );
  }

  async create(createProductBundleDto: CreateProductBundleDto): Promise<ProductBundle> {
    const bundle = await this.inventoriesService.findOne(createProductBundleDto.bundleStdSku);
    const inventory = await this.inventoriesService.findOne(createProductBundleDto.stdSku);
    const productBundle = CreateProductBundleDto.toProductBundleEntity(createProductBundleDto, bundle, inventory);

    return this.productBundlesRepository.save(productBundle);
  }

  async remove(bundleStdSku: string, stdSku?: string): Promise<void> {
    const option = {
      bundle: { stdSku: bundleStdSku },
    };

    await this.productBundlesRepository.delete(
      stdSku
        ? {
            ...option,
            inventory: { stdSku },
          }
        : option,
    );
  }

  async getProductBundleQuantity(bundleStdSku: string): Promise<number> {
    const productBundles: ProductBundle[] = await this.find(bundleStdSku);
    return this.getBundleQuantity(productBundles);
  }

  async updateProductBundleQuantity(bundleStdSku: string): Promise<void> {
    const productBundles: ProductBundle[] = await this.find(bundleStdSku);
    this.updateBundleQuantity(productBundles);
  }

  async updateAllProductBundleQuantity(): Promise<void> {
    const productBundles: ProductBundle[] = await this.findAll();

    const productBundleMap: Map<string, ProductBundle[]> = productBundles.reduce(
      (map: Map<string, ProductBundle[]>, productBundle: ProductBundle): Map<string, ProductBundle[]> =>
        map.set(productBundle.bundle.stdSku, [...(map.get(productBundle.bundle.stdSku) || []), productBundle]),
      new Map<string, ProductBundle[]>(),
    );

    await Promise.all([...productBundleMap.values()].map(this.updateBundleQuantity.bind(this)));

    return;
  }

  private async updateBundleQuantity(productBundles: ProductBundle[]): Promise<void> {
    if (productBundles.length < 1) {
      return;
    }

    await this.getBundleQuantity(productBundles).then((quantity: number) => {
      const [{ bundle: inventory }] = productBundles;
      inventory.productQty = quantity;
      this.inventoriesService.create(CreateInventoryDto.fromInventory(inventory));
    });

    return;
  }

  private async getBundleQuantity(productBundles: ProductBundle[]): Promise<number> {
    if (productBundles.length < 1) {
      return 0;
    }

    const quantityList: number[] = await Promise.all(
      productBundles.map(async (productBundle: ProductBundle): Promise<number> => {
        const interchangeableGroupMap: InterchangeableGroupMap =
          await this.interchangeableGroupsService.findMappingByStdSku(productBundle.inventory.stdSku);

        if (interchangeableGroupMap) {
          return Math.floor(interchangeableGroupMap.interchangeableGroup.quantity / productBundle.bundleSize);
        }

        return Math.floor(productBundle.inventory.productQty / productBundle.bundleSize);
      }),
    );

    return Math.min(...quantityList);
  }
}
