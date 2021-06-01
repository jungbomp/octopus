import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Market } from './market.entity';
import { OrderItem } from './orderItem.entity';
import { User } from './user.entity';

@Entity()
export class Orders {
  @PrimaryColumn({ type: 'char', length: 45 })
  channelOrderCode: string;

  @ManyToOne(() => Market, market => market.marketId, {
    primary: true,
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  market: Market;

  @Index()
  @Column({ type: 'char', length: 8})
  orderDate: string;

  @Column({ type: 'int' })
  orderQty: number;

  @Column({ type: 'float' })
  orderPrice: number;

  @Column({ type: 'float', nullable: true })
  orderShippingPrice: number;

  @Column({ type: 'float', nullable: true })
  shippingPrice: number;

  @Column({ type: 'char', length: 2, default: '00' })
  shippingStatus: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  trackingNo: string;

  @ManyToOne(() => User, user => user.employeeId, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  user: User;

  @Column({ type: 'char', length: 8, nullable: true })
  procDate: string;

  @Column({ type: 'char', length: 6, nullable: true })
  procTime: string;

  @Index()
  @Column({ type: 'char', length: 14, nullable: true })
  lastModifiedDttm: string;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  orderItems: OrderItem[];
}