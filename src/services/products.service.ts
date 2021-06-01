import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto, } from '../models/dto/createProduct.dto';
import { UpdateProductDto } from '../models/dto/updateProduct.dto';
import { Product } from '../models/product.entity';
import { BrandsService } from './brands.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly brandsService: BrandsService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const brand = await this.brandsService.findOne(createProductDto.brandCode);
    const product = CreateProductDto.toProductEntity(createProductDto, brand);

    return await this.productsRepository.save(product);
  }

  async findAll(includeManufacturing: boolean, brandCode?: string): Promise<Product[]> {
    if (!includeManufacturing) {
      return this.productsRepository.find();
    }

    // return this.productsRepository.find({
    //   relations: ['manufacturingMaps', 'productMaps']
    // })

    const products = await this.productsRepository.createQueryBuilder('product')
      .distinct(true)
      .leftJoinAndSelect('product.manufacturingMaps', 'manufacturingMap')
      .innerJoinAndSelect('product.brand', 'brand')
      .innerJoin('product.productMaps', 'productMap')
      .orderBy('product.productCode')
      .getMany();

    return (brandCode || null) !== null ? products.filter(product => product.brand.brandCode === brandCode) : products;
  }

  findOne(productCode: string, includeManufacturing?: boolean): Promise<Product> {
    if (!includeManufacturing) {
      return this.productsRepository.findOne(productCode);
    }

    return this.productsRepository.findOne({
      join: {
        alias: 'product',
        leftJoinAndSelect: {
          manufacturingMap: 'product.manufacturingMaps'
        },
        innerJoin: {
          productMap: 'product.productMaps'
        }
      },
      where: { productCode }
    })
  }

  async remove(productCode: string): Promise<void> {
    await this.productsRepository.delete(productCode);
  }

  async update(productCode: string, updateProductDto: UpdateProductDto): Promise<void> {
    const brand = await this.brandsService.findOne(updateProductDto.brandCode);
    const product = UpdateProductDto.toProductEntity(updateProductDto, brand);
      
    await this.productsRepository.update(productCode, product);
  }
}
