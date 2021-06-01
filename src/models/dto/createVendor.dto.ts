import { Vendor } from '../vendor.entity';

export class CreateVendorDto {
  vendorCode: string;
  vendorName: string;
  vendorEmail: string;
  note: string;
  ordersFrom: string;
  
  static toVendorEntity(dto: CreateVendorDto): Vendor {
    const vendor = new Vendor();
    vendor.vendorCode = dto.vendorCode;
    vendor.vendorName = dto.vendorName;
    vendor.vendorEmail = dto.vendorEmail;
    vendor.note = dto.note;
    vendor.ordersFrom = dto.ordersFrom;
    
    return vendor;
  }
}
