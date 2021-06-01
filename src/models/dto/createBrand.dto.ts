import { Brand } from '../brand.entity';

export class CreateBrandDto {
  brandCode: string;
  brandName: string;
  email: string;
  ordersFrom: string;
  
  static toBrandEntity(dto: CreateBrandDto): Brand {
    const brand = new Brand();
    brand.brandCode = dto.brandCode;
    brand.brandName = dto.brandName;
    brand.email = dto.email;
    brand.ordersFrom = dto.ordersFrom;
    
    return brand;
  }
}
