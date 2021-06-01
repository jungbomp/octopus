import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Brand {
  @PrimaryColumn({ type: 'char', length: 2 })
  brandCode: string;

  @Column({ type: 'varchar', length: 128})
  brandName: string;

  @Column({ type: 'varchar', length: 128 })
  email: string;

  @Column({ type: 'varchar', length: 128 })
  ordersFrom: string;

  @OneToMany(() => Product, product => product.brand)
  products: Product[];
}