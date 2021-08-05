import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { InterchangeableGroup } from './interchangeableGroup.entity';
import { Inventory } from './inventory.entity';

@Entity()
export class InterchangeableGroupMap {
  @ManyToOne(() => InterchangeableGroup, interchangeableGroup => interchangeableGroup.inventory, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  interchangeableGroup: InterchangeableGroup;

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