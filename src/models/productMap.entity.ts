import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Product } from './product.entity';

@Entity()
export class ProductMap {
  @ManyToOne(() => Product, product => product.productCode, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  inventory: Inventory;

  @Column({ type: 'char', length: 1 })
  outOfStock: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  memo: string;
}