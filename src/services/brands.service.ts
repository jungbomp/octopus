import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto, } from '../models/dto/createBrand.dto';
import { UpdateBrandDto } from '../models/dto/updateBrand.dto';
import { Brand } from '../models/brand.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
  ) {}

  create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const brand = CreateBrandDto.toBrandEntity(createBrandDto);

    return this.brandsRepository.save(brand);
  }

  async findAll(hasProduct: boolean): Promise<Brand[]> {
    if (hasProduct) {
      const brands = (await this.brandsRepository.find({ relations: ['products'] })).filter(brand => brand.products.length > 0);

      return brands;
    }
    
    return await this.brandsRepository.find();
  }

  findOne(brandCode: string): Promise<Brand> {
    return this.brandsRepository.findOne({ relations: ['products'], where: { brandCode }});
  }

  async remove(brandCode: string): Promise<void> {
    await this.brandsRepository.delete(brandCode);
  }

  async update(brandCode: string, updateBrandDto: UpdateBrandDto): Promise<void> {
    const brand = UpdateBrandDto.toBrandEntity(updateBrandDto);
      
    await this.brandsRepository.update(brandCode, brand);
  }
}
