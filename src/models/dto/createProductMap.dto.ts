import { Inventory } from '../inventory.entity';
import { Product } from '../product.entity';
import { ProductMap } from '../productMap.entity';

export class CreateProductMapDto {
  productCode: string;
  stdSku: string;
  outOfStock: string;
  memo: string;

  static toProductMapEntity(dto: CreateProductMapDto, product: Product, inventory: Inventory): ProductMap {
    const productMap = new ProductMap();
    productMap.product = { ...product };
    productMap.inventory = { ...inventory };
    productMap.outOfStock = dto.outOfStock;
    productMap.memo = dto.memo;

    return productMap;
  }
}
