import { ManufacturingMap } from '../manufacturingMap.entity';
import { Product } from '../product.entity';
import { Inventory } from '../inventory.entity';

export class CreateManufacturingMapDto {
  productCode: string;
  stdSku: string;
  manufacturingCode: string;
  manufacturingTitle: string;
  manufacturingColor: string;

  static toManufacturingMapEntity(dto: CreateManufacturingMapDto, product: Product, inventory: Inventory): ManufacturingMap {
    const manufacturingMap = new ManufacturingMap();
    manufacturingMap.product = product;
    manufacturingMap.inventory = inventory;
    manufacturingMap.manufacturingCode = dto.manufacturingCode;
    manufacturingMap.manufacturingTitle = dto.manufacturingTitle;
    manufacturingMap.manufacturingColor = dto.manufacturingColor;

    return manufacturingMap;
  }
}
