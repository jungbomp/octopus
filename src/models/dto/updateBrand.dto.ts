import { Brand } from '../brand.entity';

export class UpdateBrandDto {
  brandName: string;
  email: string;
  ordersFrom: string;
  
  static toBrandEntity(dto: UpdateBrandDto): Brand {
    const brand = new Brand();
    brand.brandName = dto.brandName;
    brand.email = dto.email;
    brand.ordersFrom = dto.ordersFrom;
    
    return brand;
  }
}
