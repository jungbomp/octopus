import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { StdSize } from './stdSize.entity';

@Entity()
export class Inventory {
  @PrimaryColumn({ type: 'varchar', length: 45 })
  stdSku: string;

  @ManyToOne(() => Product, product => product.productCode, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  product: Product;

  @Column({ type: 'varchar', length: 45})
  productSupplier: string;

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'varchar', length: 100 })
  productSize: string;

  @Column({ type: 'varchar', length: 100 })
  productColor: string;
  
  @Column({ type: 'varchar', length: 100 })
  productDesign: string;

  @Column({ type: 'int' })
  productQty: number;

  @Column({ type: 'float' })
  productPrice: number;

  @Column({ type: 'float' })
  garmentCost: number;

  @Column({ type: 'float' })
  productWeight: number;

  @Column({ type: 'float' })
  productLength: number;

  @Column({ type: 'float' })
  productWidth: number;

  @Column({ type: 'float' })
  productHeight: number;

  @ManyToOne(() => StdSize, stdSize => stdSize.sizeCode, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  stdSize: StdSize;

  @Column({ type: 'char', length: 5, nullable: true })
  sizeCode: string;

  @Column({ type: 'char', length: 1 })
  validYn: string;
}