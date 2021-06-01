import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Vendor {
  @PrimaryColumn({ type: 'char', length: 2 })
  vendorCode: string;

  @Column({ type: 'varchar', length: 128 })
  vendorName: string;

  @Column({ type: 'varchar', length: 128 })
  vendorEmail: string;

  @Column({ type: 'varchar', length: 256 })
  note: string;

  @Column({ type: 'varchar', length: 128 })
  ordersFrom: string;
}