import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Market {
  @PrimaryColumn({ type: 'int' })
  marketId: number;

  @Column({ type: 'int'})
  channelId: number;

  @Column({ type: 'varchar', length: 128 })
  channelName: string;

  @Column({ type: 'varchar', length: 128 })
  storeName: string;

  @Column({ type: 'varchar', length: 128 })
  channelImagePath: string;
}