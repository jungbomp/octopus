import { Inventory } from '../inventory.entity';
import { ProductBundle } from '../productBundle.entity';

export class CreateProductBundleDto {
  bundleStdSku: string;
  stdSku: string;
  bundleSize: number;

  static toProductBundleEntity(dto: CreateProductBundleDto, bundle: Inventory, inventory: Inventory): ProductBundle {
    const productBundle = new ProductBundle();
    productBundle.bundle = { ...bundle };
    productBundle.inventory = { ...inventory };
    productBundle.bundleSize = dto.bundleSize;

    return productBundle;
  }
}
