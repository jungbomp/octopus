import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorsService } from './vendors.service';
import { BrandsService } from './brands.service';
import { ProductsService } from './products.service';
import { VendorMap } from '../models/vendorMap.entity';
import { CreateVendorMapDto } from '../models/dto/createVendorMap.dto';
import { VendorMapProduct } from '../models/dto/vendorMapProduct.dto';

@Injectable()
export class VendorMapsService {
  constructor(
    @InjectRepository(VendorMap)
    private readonly vendorMapRepository: Repository<VendorMap>,
    private readonly vendorsService: VendorsService,
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(): Promise<VendorMap[]> {
    return this.vendorMapRepository.find();
  }

  async findMappingProducts(vendorCode: string, brandCode: string) : Promise<VendorMapProduct[]> {

    const vendorMaps = ((vendorCode || null) === null && (brandCode || null) === null ? await this.findAll()
      : await this.find(vendorCode, brandCode)).filter(vendorMap => (vendorMap.vendor || null) !== null && (vendorMap.brand || null) !== null);

    const brands = new Set(vendorMaps.map(vendorMaps => vendorMaps.brand.brandCode));
    const products = (await this.productsService.findAll(true)).filter(product => brands.has(product.brand.brandCode));

    return vendorMaps
      .map(vendorMap => products.filter(product => product.brand.brandCode === vendorMap.brand.brandCode)
        .map(product => new VendorMapProduct(
          vendorMap.vendor.vendorCode,
          product.productCode,
          product.productTitle,
          product.packInfo,
          product.orderBySize,
          product.manufacturingMaps.length > 0 ? product.manufacturingMaps[0].manufacturingCode : '')))
      .reduce((acc, cur) => acc.concat(cur), []);
  }

  async find(vendorCode: string, brandCode: string): Promise<VendorMap[]> {
    // const list = await this.vendorMapRepository.createQueryBuilder('vendorMap').where('vendorVendorCode = :vendorCode', { vendorCode: vendorCode }).getRawMany();

    const option = {};
    if (vendorCode) {
      option['vendor']= { vendorCode }
    }

    if (brandCode) {
      option['brand'] = { brandCode }
    }
    
    return await this.vendorMapRepository.find(option);

    // const vendorOption = {
    //   vendor: { vendorCode }
    // };
    
    // return await this.vendorMapRepository.find(brandCode ? {
    //   ...vendorOption,
    //   brand: { brandCode }
    // } : vendorOption);
  }

  async create(createVendorMapDto: CreateVendorMapDto): Promise<VendorMap> {
    const vendorMap = new VendorMap();
    vendorMap.vendor = await this.vendorsService.findOne(createVendorMapDto.vendorCode);
    vendorMap.brand = await this.brandsService.findOne(createVendorMapDto.brandCode);

    return this.vendorMapRepository.save(vendorMap);
  }

  async remove(vendorCode: string, brandCode: string): Promise<void> {
    const vendorOption = {
      vendor: { vendorCode }
    };
    
    await this.vendorMapRepository.delete(brandCode ? {
      ...vendorOption,
      brand: { brandCode }
    } : vendorOption);   
  }
}
