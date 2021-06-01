import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Brand } from './brand.entity';
import { Inventory } from './inventory.entity';
import { Product } from './product.entity';
import { User } from './user.entity';
import { Vendor } from './vendor.entity';

@Entity()
export class ProductOrder {
  @PrimaryColumn()
  orderSeq: number;

  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  inventory: Inventory;

  @ManyToOne(() => Product, product => product.productCode, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Brand, brand => brand.brandCode, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  brand: Brand;

  @ManyToOne(() => Vendor, vendor => vendor.vendorCode, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  vendor?: Vendor;
  
  @Column({ type: 'int' })
  orderQty: number;

  @Index()
  @Column({ type: 'char', length: 8})
  orderDate: string;
  
  @Column({ type: 'char', length: 6 })
  orderTime: string;

  @ManyToOne(() => User, user => user.employeeId, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  user?: User;
}