import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Orders } from './orders.entity';

@Entity()
export class OrderItem {
  @ManyToOne(() => Orders, order => order.channelOrderCode, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  order: Orders;

  @PrimaryColumn({ type: 'char', length: 45 })
  listingSku: string;

  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  inventory: Inventory;

  @Column({ type: 'float' })
  unitPrice: number;

  @Column({ type: 'int' })
  unitQuantity: number;

  @Column({ type: 'char', length: 2, default: '00' })
  packingStatus: string;

  @Column({ type: 'char', length: 1, default: 'N' })
  noItemYn: string;

  @Column({ type: 'char', length: 1, default: 'N' })
  tagChangeYn: string;

  @Column({ type: 'float' })
  garmentCost: number;
}