import { ClockIn } from '../clockIn.entity';

export class CreateClockInDto {
  employeeId: string;
  clockInDttm: string;

  static toClockInEntity(dto: CreateClockInDto): ClockIn {
    const clockIn = new ClockIn();
    clockIn.employeeId = '' + dto.employeeId;
    clockIn.clockInDttm = '' + dto.clockInDttm;

    return clockIn;
  }
}
