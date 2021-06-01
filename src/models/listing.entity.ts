import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Market } from './market.entity';

@Entity()
export class Listing {
  @PrimaryColumn({ type: 'varchar', length: 45 })
  listingItemId: string;

  @ManyToOne(() => Market, market => market.marketId, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  market: Market;

  @PrimaryColumn({ type: 'varchar', length: 45})
  listingSku: string;

  @Index()
  @ManyToOne(() => Inventory, inventory => inventory.stdSku, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  inventory: Inventory;

  @Column({ type: 'varchar', length: 200})
  listingItemName: string;

  @Column({ type: 'int' })
  listingItemQuantity: number;

  @Column({ type: 'float' })
  listingItemPrice: number;

  @Column({ type: 'char', length: 1, default: 'Y' })
  isActive: string;

  @Column({ type: 'char', length: 14})
  createdDttm: string;

  @Column({ type: 'char', length: 14})
  lastModifiedDttm: string;
}