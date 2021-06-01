import { Brand } from '../brand.entity';
import { Product } from '../product.entity';

export class CreateProductDto {
  productCode: string;
  productTitle: string;
  brandCode: string;
  packInfo: number;
  orderBySize: string;

  static toProductEntity(dto: CreateProductDto, brand: Brand): Product {
    const product = new Product();
    product.productCode = dto.productCode;
    product.productTitle = dto.productTitle;
    product.brand = brand;
    product.packInfo = dto.packInfo;
    product.orderBySize = dto.orderBySize;

    return product;
  }
}
