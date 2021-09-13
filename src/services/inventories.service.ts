import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LogiwaService } from './logiwa.service';
import { ProductsService } from './products.service';
import { StdSizesService } from './stdSizes.service';

import { CreateInventoryDto } from '../models/dto/createInventory.dto';
import { LogiwaAvailableToPromiseReportSearchDto } from '../models/dto/logiwaAvailableToPromiseReportSearch.dto';
import { LogiwaInventoryitemSearchDto } from '../models/dto/logiwaInventoryItemSearch.dto';
import { UpdateInventoryDto } from '../models/dto/updateInventory.dto';

import { Inventory } from '../models/inventory.entity';
import { Orders } from '../models/orders.entity';
import { OrderItem } from '../models/orderItem.entity';
import { Product } from '../models/product.entity';
import { StdSize } from '../models/stdSize.entity';

import { getDttmFromDate } from '../utils/dateTime.util';

@Injectable()
export class InventoriesService {
  private readonly logger = new Logger(InventoriesService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventorysRepository: Repository<Inventory>,
    private readonly productsService: ProductsService,
    private readonly stdSizesService: StdSizesService,
    private readonly logiwaService: LogiwaService,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const product = await this.productsService.findOne(createInventoryDto.productCode, false);
    const stdSize = await this.stdSizesService.findOne(createInventoryDto.sizeCode)
    const inventory = CreateInventoryDto.toInventoryEntity(createInventoryDto, product, stdSize);

    return this.inventorysRepository.save(inventory);
  }

  async createBatch(createInventories: CreateInventoryDto[]): Promise<Inventory[]> {
    const inventories: Inventory[] = createInventories.map((dto: CreateInventoryDto): Inventory => {
      const product = new Product();
      product.productCode = dto.productCode;

      const stdSize = new StdSize();
      stdSize.sizeCode = dto.sizeCode;
    
      return CreateInventoryDto.toInventoryEntity(dto, dto.productCode ? product : undefined, dto.sizeCode ? stdSize : undefined);
    });

    return this.inventorysRepository.save(inventories);
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventorysRepository.find();
  }

  findOne(stdSku: string): Promise<Inventory> {
    return this.inventorysRepository.findOne(stdSku);
  }

  async remove(stdSku: string): Promise<void> {
    await this.inventorysRepository.delete(stdSku);
  }

  async update(stdSku: string, updateInventoryDto: UpdateInventoryDto): Promise<void> {
    const product = await this.productsService.findOne(updateInventoryDto.productCode, false);
    const stdSize = await this.stdSizesService.findOne(updateInventoryDto.sizeCode)
    const inventory = UpdateInventoryDto.toInventoryEntity(updateInventoryDto, product, stdSize);
      
    await this.inventorysRepository.update(stdSku, inventory);
  }

  async loadInventoryDataFromLogiwa(logiwaInventoryItemSearchDto: LogiwaInventoryitemSearchDto): Promise<void> {
    this.logger.log('load inventory data from logiwa');
    this.logger.log(logiwaInventoryItemSearchDto);

    const availableStockInfoMap: Map<string, number> = await this.logiwaAllAvailableToPromiseReportList().then(availableReportList =>
      availableReportList.reduce((acc: Map<string, number>, availableReport: any): Map<string, number> => 
        acc.set(availableReport.Code, availableReport.StockQuantity - availableReport.OrderQuantity), new Map<string, number>()));

    const stdSizeMap: Map<string, StdSize> = await this.stdSizesService.findAll().then((stdSizes: StdSize[]): Map<string, StdSize> =>
      stdSizes.reduce((acc: Map<string, StdSize>, stdSize: StdSize): Map<string, StdSize> => acc.set(stdSize.sizeName, stdSize), new Map<string, StdSize>()));

    const productMap: Map<string, Product> = await this.productsService.findAll(false).then((products: Product[]): Map<string, Product> =>
      products.reduce((acc: Map<string, Product>, product: Product): Map<string, Product> => acc.set(product.productCode, product), new Map<string, Product>()));

    logiwaInventoryItemSearchDto.selectedPageIndex = (logiwaInventoryItemSearchDto.selectedPageIndex ?? 1);
    
    while (true) {
      const { Data: logiwaItems } = await this.logiwaService.inventoryItemSearch(logiwaInventoryItemSearchDto);
      if (logiwaItems.length < 1) {
        break;
      }

      const createInventories: CreateInventoryDto[] = [];
      for (let i = 0; i < logiwaItems.length; i++) {
        const logiwaItem = logiwaItems[i];

        if (logiwaItem.Code.startsWith('FBA')) {
          continue;
        }

        const inventoryItemPackTypeId = await this.logiwaService.getLogiwaInventoryItemPackTypeId(logiwaItem.ID, logiwaItem);
        const inventoryItemPackType = await this.logiwaService.getLogiwaInventoryItemPackType(logiwaItem.ID, `${inventoryItemPackTypeId}`);

        const createInventoryDto = new CreateInventoryDto();
        createInventoryDto.stdSku = logiwaItem.Code.toUpperCase();
        createInventoryDto.productName = logiwaItem.Description;
        createInventoryDto.productSize = (logiwaItem.Size || '').length > 0 ? logiwaItem.Size : undefined;
        createInventoryDto.productColor = logiwaItem.Brand;
        createInventoryDto.productQty = Math.max(availableStockInfoMap.get(logiwaItem.Code) ?? 0, 0);
        createInventoryDto.productPrice = logiwaItem.SalesUnitPrice;
        createInventoryDto.garmentCost = Number(logiwaItem.PurchaseUnitPrice);
        createInventoryDto.productWeight = inventoryItemPackType?.Weight;
        createInventoryDto.productLength = inventoryItemPackType?.Length;
        createInventoryDto.productWidth = inventoryItemPackType?.Width;
        createInventoryDto.productHeight = inventoryItemPackType?.Height;
        createInventoryDto.sizeCode = stdSizeMap.get(logiwaItem.Size)?.sizeCode;
        createInventoryDto.productCode = productMap.get(logiwaItem.Code.substring(0, logiwaItem.Code.indexOf('-')))?.productCode;

        createInventories.push(createInventoryDto);
      }

      try {
        const inventories = await this.createBatch(createInventories);
        this.logger.log(
          `Page Done ${logiwaInventoryItemSearchDto.selectedPageIndex}/${logiwaItems[0].PageCount} with ${inventories.length} inventory records`
        );
      } catch (error) {
        this.logger.log(`Failed to store inventory data on page ${logiwaInventoryItemSearchDto.selectedPageIndex}/${logiwaItems[0]?.PageCount ?? 0}`);
        this.logger.log(error);
      }

      if (logiwaInventoryItemSearchDto.selectedPageIndex >= (logiwaItems[0]?.PageCount ?? 0)) {
        break;
      }

      logiwaInventoryItemSearchDto.selectedPageIndex = logiwaInventoryItemSearchDto.selectedPageIndex + 1;
    }
  }

  async loadInventoryDataFromLogiwaByOrderedItem(orders: Orders[]): Promise<void> {
    this.logger.log('load inventory data from logiwa filtered by order items');

    const stdSkuList: string[] = [
      ...(new Set(orders.map(
        (order: Orders): string[] => order.orderItems.map(
          (orderItem: OrderItem): string => orderItem.inventory.stdSku)).flat(1)
        ))
    ];

    const availableStockInfoMap: Map<string, number> = await this.logiwaAllAvailableToPromiseReportList()
      .then(availableReportList =>
        availableReportList.reduce(
          (acc: Map<string, number>, availableReport: any): Map<string, number> =>
            acc.set(availableReport.Code, availableReport.StockQuantity - availableReport.OrderQuantity),
          new Map<string, number>()
        )
      );

    const stdSizeMap: Map<string, StdSize> = await this.stdSizesService.findAll()
      .then((stdSizes: StdSize[]): Map<string, StdSize> =>
        stdSizes.reduce(
          (acc: Map<string, StdSize>, stdSize: StdSize): Map<string, StdSize> => acc.set(stdSize.sizeName, stdSize),
          new Map<string, StdSize>()
        )
      );

    const productMap: Map<string, Product> = await this.productsService.findAll(false)
      .then((products: Product[]): Map<string, Product> =>
        products.reduce(
          (acc: Map<string, Product>, product: Product): Map<string, Product> => acc.set(product.productCode, product),
          new Map<string, Product>()
        )
      );

    for (let i = 0; i < stdSkuList.length; i++) {
      const stdSku = stdSkuList[i];

      const logiwaInventoryItemSearchDto: LogiwaInventoryitemSearchDto = { code: stdSku };
      const { Data: [logiwaItem] } = await this.logiwaService.inventoryItemSearch(logiwaInventoryItemSearchDto);

      const inventoryItemPackTypeId = await this.logiwaService.getLogiwaInventoryItemPackTypeId(logiwaItem.ID, logiwaItem);
      const inventoryItemPackType = await this.logiwaService.getLogiwaInventoryItemPackType(logiwaItem.ID, `${inventoryItemPackTypeId}`);

      const createInventoryDto = new CreateInventoryDto();
      createInventoryDto.stdSku = logiwaItem.Code.toUpperCase();
      createInventoryDto.productName = logiwaItem.Description;
      createInventoryDto.productSize = (logiwaItem.Size || '').length > 0 ? logiwaItem.Size : undefined;
      createInventoryDto.productColor = logiwaItem.Brand;
      createInventoryDto.productQty = Math.max(availableStockInfoMap.get(logiwaItem.Code) ?? 0, 0);
      createInventoryDto.productPrice = logiwaItem.SalesUnitPrice;
      createInventoryDto.garmentCost = Number(logiwaItem.PurchaseUnitPrice);
      createInventoryDto.productWeight = inventoryItemPackType?.Weight;
      createInventoryDto.productLength = inventoryItemPackType?.Length;
      createInventoryDto.productWidth = inventoryItemPackType?.Width;
      createInventoryDto.productHeight = inventoryItemPackType?.Height;
      createInventoryDto.sizeCode = stdSizeMap.get(logiwaItem.Size)?.sizeCode;
      createInventoryDto.productCode = productMap.get(logiwaItem.Code.substring(0, logiwaItem.Code.indexOf('-')))?.productCode;

      try {
        const inventories = await this.create(createInventoryDto);
        this.logger.log(`Updated ${i+1}/${stdSkuList.length} inventory records`);
      } catch (error) {
        this.logger.log(`Failed to store inventory data on page ${i+1}/${stdSkuList.length}`);
        this.logger.log(error);
      }
    }
  }

  private async logiwaAllAvailableToPromiseReportList(): Promise<any> {
    const logiwaAvailableToPromiseReportSearchDto: LogiwaAvailableToPromiseReportSearchDto = { selectedPageIndex: 1 }

    let list = [];
    while (true) {
      const { Data: availableToPromiseReport } = await this.logiwaService.availableToPromiseReportSearch(logiwaAvailableToPromiseReportSearchDto);
      list = [...list, ...availableToPromiseReport ];

      this.logger.log(`Loading available report ${logiwaAvailableToPromiseReportSearchDto.selectedPageIndex}/${availableToPromiseReport[0].PageCount}`)

      if (logiwaAvailableToPromiseReportSearchDto.selectedPageIndex === availableToPromiseReport[0].PageCount) {
        this.logger.log('Complete to load available report');
        break;
      }


      logiwaAvailableToPromiseReportSearchDto.selectedPageIndex = logiwaAvailableToPromiseReportSearchDto.selectedPageIndex + 1;
    }

    return list;
  }
}