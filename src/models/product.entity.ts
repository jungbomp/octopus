import { Entity, Column, PrimaryColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Brand } from './brand.entity';
import { ManufacturingMap } from './manufacturingMap.entity';
import { ProductMap } from './productMap.entity';

@Entity()
export class Product {
  @PrimaryColumn({ type: 'char', length: 8 })
  productCode: string;

  @Column({ type: 'varchar', length: 128})
  productTitle: string;

  @ManyToOne(() => Brand, brand => brand.brandCode, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @Index()
  @JoinColumn()
  brand: Brand;

  @Column({ type: 'int' })
  packInfo: number;

  @Column({ type: 'char', length: 1 })
  orderBySize: string;

  @OneToMany(() => ManufacturingMap, manufacturingMap => manufacturingMap.product)
  manufacturingMaps: ManufacturingMap[];

  @OneToMany(() => ProductMap, productMap => productMap.product)
  productMaps: ProductMap[];
}