import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Product } from './product.entity';

@Entity()
export class ManufacturingMap {
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

  @Column({ type: 'varchar', length: 16 })
  manufacturingCode: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  manufacturingTitle: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturingColor: string;
}