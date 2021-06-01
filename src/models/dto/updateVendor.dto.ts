import { Vendor } from '../vendor.entity';

export class UpdateVendorDto {
  vendorName: string;
  vendorEmail: string;
  note: string;
  ordersFrom: string;
  
  static toVendorEntity(dto: UpdateVendorDto): Vendor {
    const vendor = new Vendor();
    vendor.vendorName = dto.vendorName;
    vendor.vendorEmail = dto.vendorEmail;
    vendor.note = dto.note;
    vendor.ordersFrom = dto.ordersFrom;
    
    return vendor;
  }
}
