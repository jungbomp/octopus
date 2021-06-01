import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Brand } from './brand.entity';
import { Vendor } from './vendor.entity';

@Entity()
export class VendorMap {
  @ManyToOne(() => Vendor, vendor => vendor.vendorCode, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  vendor: Vendor;

  @ManyToOne(() => Brand, brand => brand.brandCode, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  brand: Brand;
}