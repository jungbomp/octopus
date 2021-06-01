import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateUserDto } from '../models/dto/createUser.dto';
import { UpdateUserDto } from '../models/dto/updateUser.dto';
import { User } from '../models/user.entity';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':employeeId')
  findOne(@Param('employeeId') employeeId: string):  Promise<User> {
    return this.usersService.findOne(employeeId).then(user => user || new User());
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Delete(':employeeId')
  remove(@Param('employeeId') employeeId: string): Promise<void> {
    return this.usersService.remove(employeeId);
  }

  @Put(':employeeId')
  update(@Param('employeeId') employeeId: string, @Body() updateUserDto: UpdateUserDto): Promise<void> {
    return this.usersService.update(employeeId, updateUserDto);
  }
}
