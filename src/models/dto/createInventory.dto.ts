import { InterchangeableGroup } from '../interchangeableGroup.entity';
import { Inventory } from '../inventory.entity';
import { Product } from '../product.entity';
import { StdSize } from '../stdSize.entity';

export class CreateInventoryDto {
  stdSku: string;
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
  sizeCode: string;
  validYn: string;
  interchangeableGroupStdSku?: string;

  static toInventoryEntity(dto: CreateInventoryDto, product: Product, stdSize: StdSize, interchangeableGroup?: InterchangeableGroup): Inventory {
    const inventory = new Inventory();
    inventory.stdSku = dto.stdSku;
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
    inventory.sizeCode = dto.sizeCode;
    inventory.validYn = dto.validYn;
    inventory.product = product;
    inventory.stdSize = stdSize;
    inventory.interchangeableGroup = interchangeableGroup;

    return inventory;
  }

  static fromInventory(inventory: Inventory): CreateInventoryDto {
    const dto = new CreateInventoryDto();
    dto.stdSku = inventory.stdSku;
    dto.productSupplier = inventory.productSupplier;
    dto.productName = inventory.productName;
    dto.productSize = inventory.productSize;
    dto.productColor = inventory.productColor;
    dto.productDesign = inventory.productDesign;
    dto.productQty = inventory.productQty;
    dto.productPrice = inventory.productPrice;
    dto.garmentCost = inventory.garmentCost;
    dto.productWeight = inventory.productWeight;
    dto.productLength = inventory.productLength;
    dto.productWidth = inventory.productWidth;
    dto.productHeight = inventory.productHeight;
    dto.sizeCode = inventory.sizeCode;
    dto.validYn = inventory.validYn;
    dto.productCode = inventory.product?.productCode;
    dto.interchangeableGroupStdSku = inventory.interchangeableGroup?.inventory.stdSku

    return dto;
  }
}