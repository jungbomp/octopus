import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStdSizeDto } from '../models/dto/createStdSize.dto';
import { UpdateStdSizeDto } from '../models/dto/updateStdSize.dto';
import { StdSize } from '../models/stdSize.entity';

@Injectable()
export class StdSizesService {
  constructor(
    @InjectRepository(StdSize)
    private readonly stdSizesRepository: Repository<StdSize>,
  ) {}

  create(createStdSizeDto: CreateStdSizeDto): Promise<StdSize> {
    const stdSize = CreateStdSizeDto.toStdSizeEntity(createStdSizeDto);

    return this.stdSizesRepository.save(stdSize);
  }

  async findAll(): Promise<StdSize[]> {
    return this.stdSizesRepository.find();
  }

  findOne(sizeCode: string): Promise<StdSize> {
    return this.stdSizesRepository.findOne(sizeCode);
  }

  async remove(sizeCode: string): Promise<void> {
    await this.stdSizesRepository.delete(sizeCode);
  }

  async update(sizeCode: string, updateStdSizeDto: UpdateStdSizeDto): Promise<void> {
    const stdSize = UpdateStdSizeDto.toStdSizeEntity(updateStdSizeDto);
      
    await this.stdSizesRepository.update(sizeCode, stdSize);
  }
}
