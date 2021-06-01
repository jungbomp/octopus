import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn({ type: 'char', length: 8 })
  employeeId: string;

  @Column({ type: 'varchar', length: 32})
  firstName: string;

  @Column({ type: 'varchar', length: 32 })
  middleName: string;

  @Column({ type: 'varchar', length: 32 })
  lastName: string;

  @Column({ type: 'varchar', length: 32 })
  departmentName: string;
}