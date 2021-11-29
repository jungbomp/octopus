import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ClockIn } from '../models/clockIn.entity';
import { CreateClockInDto } from '../models/dto/createClockIn.dto';
import { ClockInService } from '../services/clockIn.service';

@Controller('clock-in')
export class ClockInController {
  constructor(private readonly clockInService: ClockInService) {}

  @Get()
  findAll(): Promise<ClockIn[]> {
    
    return this.clockInService.findAll();
  }

  @Get(':employeeId')
  @Header('Content-Type', 'application/json')
  find(@Param('employeeId') employeeId: string): Promise<ClockIn[]> {
    return this.clockInService.find(employeeId);
  }

  @Post()
  create(@Body() createClockInDto: CreateClockInDto): Promise<ClockIn> {
    return this.clockInService.create(createClockInDto);
  }

  @Post('create-new-sheet')
  createNewClockInSheet(): Promise<string> {
    return this.clockInService.createNewClockInGoogleSheetIfNewDate();
  }
}
