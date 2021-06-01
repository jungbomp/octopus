import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVendorDto } from '../models/dto/createVendor.dto';
import { UpdateVendorDto } from '../models/dto/updateVendor.dto';
import { Vendor } from '../models/vendor.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,
  ) {}

  create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const vendor = CreateVendorDto.toVendorEntity(createVendorDto);

    return this.vendorsRepository.save(vendor);
  }

  async findAll(): Promise<Vendor[]> {
    return this.vendorsRepository.find();
  }

  findOne(vendorCode: string): Promise<Vendor> {
    return this.vendorsRepository.findOne(vendorCode);
  }

  async remove(vendorCode: string): Promise<void> {
    await this.vendorsRepository.delete(vendorCode);
  }

  async update(vendorCode: string, updateVendorDto: UpdateVendorDto): Promise<void> {
    const vendor = UpdateVendorDto.toVendorEntity(updateVendorDto);
      
    await this.vendorsRepository.update(vendorCode, vendor);
  }
}
