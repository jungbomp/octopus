import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';

@Entity()
export class ProductBundle {
  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  bundle: Inventory;
  
  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  inventory: Inventory;

  @Column({ type: 'int' })
  bundleSize: number;
}