import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ClockIn {
  @PrimaryColumn({ type: 'char', length: 8 })
  employeeId: string;
  
  @PrimaryColumn({ type: 'char', length: 14 })
  clockInDttm: string;
}