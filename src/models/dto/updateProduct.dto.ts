import { Brand } from '../brand.entity';
import { Product } from '../product.entity';

export class UpdateProductDto {
  productTitle: string;
  brandCode: string;
  packInfo: number;
  orderBySize: string;

  static toProductEntity(dto: UpdateProductDto, brand: Brand): Product {
    const product = new Product();
    product.productTitle = dto.productTitle;
    product.brand = brand;
    product.packInfo = dto.packInfo;
    product.orderBySize = dto.orderBySize;

    return product;
  }
}
