import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../models/dto/createUser.dto';
import { UpdateUserDto } from '../models/dto/updateUser.dto';
import { User } from '../models/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = CreateUserDto.toUserEntity(createUserDto);

    const record = await this.usersRepository.findOne(user.employeeId);
    if (record) {
      return record;
    }

    return this.usersRepository.save(user).then(() => user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(employeeId: string): Promise<User> {
    return this.usersRepository.findOne(employeeId);
  }

  async remove(employeeId: string): Promise<void> {
    await this.usersRepository.delete(employeeId);
  }

  async update(employeeId: string, updateUserDto: UpdateUserDto): Promise<void> {
    const user = UpdateUserDto.toUserEntity(updateUserDto);
      
    await this.usersRepository.update(employeeId, user);
  }
}
