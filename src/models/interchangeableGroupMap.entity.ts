import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';

@Entity()
export class InterchangeableGroupMap {
  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  interchangeableKey: Inventory;

  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  inventory: Inventory;
}