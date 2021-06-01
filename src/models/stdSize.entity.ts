import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class StdSize {
  @PrimaryColumn({ type: 'char', length: 5 })
  sizeCode: string;

  @Column({ type: 'varchar', length: 64})
  sizeName: string;

  @Column({ type: 'char', length: 4 })
  shortSizeCode: string;

  @Column({ type: 'varchar', length: 64 })
  category: string;

  @Column({ type: 'int' })
  sizeOrder: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  note: string;
}