import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';

@Entity()
export class InterchangeableGroup {
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
  quantity: number;
}