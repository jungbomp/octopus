import { Inventory } from '../inventory.entity';
import { Product } from '../product.entity';
import { StdSize } from '../stdSize.entity';

export class UpdateInventoryDto {
  productSupplier: string;
  productName: string;
  productSize: string;
  productColor: string;
  productDesign: string;
  productQty: number;
  productPrice: number;
  garmentCost: number;
  productWeight: number;
  productLength: number;
  productWidth: number;
  productHeight: number;
  productCode: string;
  safetyStockQty: number;
  sizeCode: string;
  validYn: string;

  static toInventoryEntity(dto: UpdateInventoryDto, product: Product, stdSize: StdSize): Inventory {
    const inventory = new Inventory();
    inventory.productSupplier = dto.productSupplier;
    inventory.productName = dto.productName;
    inventory.productSize = dto.productSize;
    inventory.productColor = dto.productColor;
    inventory.productDesign = dto.productDesign;
    inventory.productQty = dto.productQty;
    inventory.productPrice = dto.productPrice;
    inventory.garmentCost = dto.garmentCost;
    inventory.productWeight = dto.productWeight;
    inventory.productLength = dto.productLength;
    inventory.productWidth = dto.productWidth;
    inventory.productHeight = dto.productHeight;
    inventory.safetyStockQty = dto.safetyStockQty;
    inventory.sizeCode = dto.sizeCode;
    inventory.product = product;
    inventory.stdSize = stdSize;
    inventory.validYn = dto.validYn;

    return inventory;
  }
}