import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  IsNull,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';

import { ChannelType, StoreType } from 'src/types';
import { findChannelTypeFromChannelId, findMarketId, findStoreType, toChannelTypeFromMarketId, toStoreTypeFromMarketId } from 'src/utils/types.util';
import { DateTimeUtil, getCurrentDate, getDttmFromDate } from 'src/utils/dateTime.util';

import { EbayApiService } from './ebayApi.service';
import { InventoriesService } from './inventories.service';
import { LogiwaService } from './logiwa.service';
import { MarketsService } from './markets.service';
import { UsersService } from './users.service';
import { WalmartApiService } from './walmartApi.service';

import { CreateOrderDto } from '../models/dto/createOrder.dto';
import { CreateOrderItemDto } from '../models/dto/createOrderItem.dto';
import { EbayApiCreateShippingFulfillmentDto } from '../models/dto/ebayApiCreateShippingFulfillment.dto';
import { LogiwaOrderSearchDto } from '../models/dto/logiwaOrderSearch.dto';
import { Market } from '../models/market.entity';
import { OrderItem } from '../models/orderItem.entity';
import { Orders } from '../models/orders.entity';
import { User } from '../models/user.entity';
import { Inventory } from 'src/models/inventory.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly ebayApiService: EbayApiService,
    private readonly inventoriesService: InventoriesService,
    private readonly logiwaService: LogiwaService,
    private readonly marketsService: MarketsService,
    private readonly usersService: UsersService,
    private readonly walmartApiService: WalmartApiService,
    private readonly dateTimeUtil: DateTimeUtil
  ) { }

  async findAll(includeOrderItems: boolean): Promise<Orders[]> {
    if (!includeOrderItems) {
      return this.ordersRepository.find();
    }

    return this.ordersRepository.find({
      relations: ['orderItems'],
    });
  }

  async find(
    channelOrderCode: string,
    marketId?: number,
    includeOrderItems?: boolean
  ): Promise<Orders[]> {
    const option = {};

    if ((channelOrderCode || '').length > 0) {
      option['channelOrderCode'] = channelOrderCode;
    }

    if (marketId) {
      option['market'] = { marketId };
    }

    return this.ordersRepository.find(
      includeOrderItems
        ? {
          relations: ['orderItems'],
          where: option,
        }
        : option
    );
  }

  async findOne(
    channelOrderCode: string,
    marketId: number,
    includeOrderItems?: boolean
  ): Promise<Orders> {
    const option = {
      channelOrderCode,
      market: { marketId },
    };

    if (includeOrderItems === true) {
      return this.ordersRepository.findOne({
        relations: ['orderItems'],
        where: option,
      });
    }

    return this.ordersRepository.findOne(option);
  }

  async findUnProcessed(
    orderDateStart?: string,
    orderDateEnd?: string,
    includeOrderItems?: boolean
  ): Promise<Orders[]> {
    const option = {
      procDate: IsNull(),
    };

    if (orderDateStart && orderDateEnd) {
      option['orderDate'] = Between(
        orderDateStart.substr(0, 8),
        orderDateEnd.substr(0, 8)
      );
    } else if (orderDateStart) {
      option['orderDate'] = MoreThanOrEqual(orderDateStart.substr(0, 8));
    } else if (orderDateEnd) {
      option['orderDate'] = LessThanOrEqual(orderDateEnd.substr(0, 8));
    }

    if (includeOrderItems === true) {
      return this.ordersRepository.find({
        relations: ['orderItems'],
        where: option,
      });
    }

    return this.ordersRepository.find(option);
  }

  async findByLastModifiedDate(
    dateStart: string,
    dateEnd: string,
    includeOrderItems?: boolean
  ): Promise<Orders[]> {
    const option = {
      lastModifiedDttm: Between(dateStart, dateEnd),
    };

    if (includeOrderItems === true) {
      return this.ordersRepository.find({
        relations: ['orderItems'],
        where: option,
      });
    }

    return this.ordersRepository.find(option);
  }

  // async findMappingProducts(productCode: string, stdSku: string): Promise<ProductMapProduct[]> {
  //   const productMaps = await ((productCode || null) === null ?  this.findAll() : this.find(productCode, stdSku));

  //   return productMaps
  //     .map(productMap => new ProductMapProduct(
  //         productMap.product.productCode,
  //         productMap.inventory.stdSku,
  //         productMap.inventory.productColor.lastIndexOf('_') > 0 ?
  //           productMap.inventory.productColor.substring(productMap.inventory.productColor.lastIndexOf('_') + 1)
  //           : productMap.inventory.productColor,
  //         productMap.inventory.stdSize.sizeCode,
  //         productMap.inventory.stdSize.shortSizeCode,
  //         productMap.inventory.stdSize.sizeOrder));
  // }

  async create(createOrderDto: CreateOrderDto): Promise<Orders> {
    const market = await this.marketsService.findOne(createOrderDto.marketId);
    const user =
      (createOrderDto.employeeId || '').length > 0
        ? await this.usersService.findOne(createOrderDto.employeeId)
        : null;
    const order = CreateOrderDto.toOrder(createOrderDto, market, user);
    const orderItems = await Promise.all(
      createOrderDto.orderItems.map(async (orderItemDto: CreateOrderItemDto) => {
        const inventory = await this.inventoriesService.findOne(orderItemDto.stdSku);
        return CreateOrderItemDto.toOrderItem(orderItemDto, order, inventory);
      }))
    order.lastModifiedDttm = this.dateTimeUtil.getCurrentDttm();

    await this.ordersRepository.save(order);
    await this.orderItemsRepository.save(orderItems);

    return this.findOne(order.channelOrderCode, order.market.marketId, true);
  }

  async createBatch(createOrderDtos: CreateOrderDto[]): Promise<number> {
    const orders = createOrderDtos.map((createOrderDto: CreateOrderDto) => {
      const market = new Market();
      market.marketId = createOrderDto.marketId;

      const user = new User();
      user.employeeId = createOrderDto.employeeId;

      const order = CreateOrderDto.toOrder(
        createOrderDto,
        market,
        (createOrderDto.employeeId || '').length > 0 ? user : null
      );
      order.lastModifiedDttm = this.dateTimeUtil.getCurrentDttm();

      return order;
    });

    const orderItems = orders
      .map((order: Orders, i: number) =>
        createOrderDtos[i].orderItems.map((orderItemDto: CreateOrderItemDto) => {
          const inventory = new Inventory();
          inventory.stdSku = orderItemDto.stdSku;
        
          return CreateOrderItemDto.toOrderItem(orderItemDto, order, inventory);
        }))
      .reduce((acc, cur) => acc.concat(cur), []);

    await this.ordersRepository.save(orders);
    await this.orderItemsRepository.save(orderItems);

    return orders.length;
  }

  async loadFromLogiwa(searchDto: LogiwaOrderSearchDto): Promise<any> {
    this.loadOrderDataFromLogiwa(searchDto);

    return { Success: true };
  }

  async loadOrderDataFromLogiwa(searchDto: LogiwaOrderSearchDto): Promise<void> {
    this.logger.log('load order data from logiwa');
    while (true) {
      searchDto.selectedPageIndex = (searchDto.selectedPageIndex || 0) + 1;

      const { Data } = await this.logiwaService.warehouseOrderSearch(searchDto);
      const createOrders: CreateOrderDto[] = await Promise.all(
        Data.filter((logiwaOrder: any) => (logiwaOrder.ChannelOrderCode || '').length > 0)
          .map(async (logiwaOrder: any): Promise<CreateOrderDto> => {
            const channel: ChannelType = findChannelTypeFromChannelId(logiwaOrder.ChannelID[0]);
            const store: StoreType = findStoreType(logiwaOrder.StoreName);

            const orderItems: CreateOrderItemDto[] = await Promise.all(
              logiwaOrder.DetailInfo.map(
                async (detail: any): Promise<CreateOrderItemDto> => {
                  const createOrderItemDto = new CreateOrderItemDto();
                  createOrderItemDto.listingSku = detail.InventoryItemInfo.substring(
                    0,
                    detail.InventoryItemInfo.indexOf('/')
                  ).trim();
                  createOrderItemDto.unitPrice = detail.SalesUnitPrice;
                  createOrderItemDto.unitQuantity = detail.PackQuantity;
                  createOrderItemDto.stdSku = await this.logiwaService.getLogiwaInventoryItemCode(detail.InventoryItemID);
                  return createOrderItemDto;
                }));

            const createOrderDto = new CreateOrderDto();
            createOrderDto.channelOrderCode = logiwaOrder.ChannelOrderCode;
            createOrderDto.marketId = findMarketId(channel, store);
            createOrderDto.orderDate = this.logiwaService.toDateStringFromLogiwaDateFormat(logiwaOrder.OrderDate).substring(0, 8);
            createOrderDto.orderQty = logiwaOrder.DetailInfo.reduce((acc: number, cur: any): number => acc + cur.PackQuantity, 0);
            createOrderDto.orderPrice = logiwaOrder.TotalSalesGrossPrice;
            createOrderDto.trackingNo = logiwaOrder.CarrierTrackingNumber.trim().length > 0 ? logiwaOrder.CarrierTrackingNumber : null;
            createOrderDto.orderItems = orderItems.reduce((acc: CreateOrderItemDto[], cur: CreateOrderItemDto): CreateOrderItemDto[] => {
                const item = acc.find((item) => item.listingSku === cur.listingSku);
                if ((item || null) !== null) {
                  item.unitQuantity = item.unitQuantity + 1;
                } else {
                  acc.push(cur);
                }
                return acc;
              },
              []
            );

            return createOrderDto;
          }));

      try {
        const created = await this.createBatch(createOrders);
        this.logger.log(
          `Page Done ${searchDto.selectedPageIndex}/${Data[0].PageCount} with ${created} orders`
        );
      } catch {
        this.logger.log(`Failed to update orders on page {searchDto.selectedPageIndex}/${Data[0].PageCount}`);
      }
      
      if (searchDto.selectedPageIndex === Data[0].PageCount) {
        break;
      }
    }
  }

  async updateTrackingToChannel(dateStart: Date, dateEnd: Date): Promise<void> {
    this.logger.log('Update tracking info to each channel between');
    this.logger.log(`${dateStart} and ${dateEnd}`);

    const orders: Orders[] = await this.findByLastModifiedDate(this.dateTimeUtil.getDttmFromDate(dateStart), this.dateTimeUtil.getDttmFromDate(dateEnd));
    const filteredOrders: Orders[] = orders.filter((order: Orders) => (order.trackingNo || '').length > 0 && (order.procDate || '').length === 0);

    this.logger.log(`Starting to update tracking number to each channel with ${filteredOrders.length} orders`);

    for (let i = 0; i < filteredOrders.length; i++) {
      const order: Orders = filteredOrders[i];
      const channelType: ChannelType = toChannelTypeFromMarketId(order.market.marketId);
      const storeType = toStoreTypeFromMarketId(order.market.marketId);

      try {
        switch (channelType) {
          case ChannelType.WALMART:
            await this.updateWalmartTrackingNo(storeType, order.channelOrderCode, order.trackingNo);
            break;

          case ChannelType.EBAY:
            await this.updateEbayTrackingNo(storeType, order.channelOrderCode, order.trackingNo);
            break;
        }
      } catch (error) {
        this.logger.log(`Failed to update tracking number - ${channelType}.${storeType} with orderId(${order.channelOrderCode}) and trackingNo(${order.trackingNo})`);
        this.logger.log(error);
      }
    }

    this.logger.log(`Completed to update tracking number to each channel`);
  }

  private async updateWalmartTrackingNo(store: StoreType, channelOrderCode: string, trackingNo: string): Promise<void> {
    const response = await this.walmartApiService.updateOrder(channelOrderCode, store, trackingNo);

    if (response.order) {
      const orderDate = new Date(
        response.order.orderLines.orderLine[0].orderLineStatuses.orderLineStatus[0].trackingInfo.shipDateTime
      );

      const criteria = {
        channelOrderCode,
        market: {
          marketId: findMarketId(ChannelType.WALMART, store)
        },
      };

      const partialEntity = {
        procDate: this.dateTimeUtil.getDttmFromDate(orderDate).substr(0, 8),
        procTime: this.dateTimeUtil.getDttmFromDate(orderDate).substr(8, 6),
        lastModifiedDttm: this.dateTimeUtil.getCurrentDttm(),
      };

      await this.ordersRepository.update(criteria, partialEntity);
    }
  }

  private async updateEbayTrackingNo(store: StoreType, channelOrderCode: string, trackingNumber: string, overwrite = false): Promise<void> {
    const order = await this.ebayApiService.getOrder(store, channelOrderCode);

    if (!overwrite && order?.fulfillmentHrefs.length > 0 && order.fulfillmentHrefs.some((fulfillmentHref: string) => fulfillmentHref.lastIndexOf(trackingNumber) > -1)) {
      return;
    }

    const currentDate: Date = getCurrentDate();
    const ebayApiCreateShippingFulfillmentDto: EbayApiCreateShippingFulfillmentDto = {
      orderId: channelOrderCode,
      lineItems: order?.lineItems.map(({ lineItemId, quantity }) => ({ lineItemId, quantity })),
      trackingNumber,
      shippingCarrierCode: 'USPS',
      shippedDate: currentDate.toISOString()
    }

    await this.ebayApiService.createShippingFulfillment(store, ebayApiCreateShippingFulfillmentDto);
    const criteria = {
      channelOrderCode,
      market: {
        marketId: findMarketId(ChannelType.EBAY, store)
      },
    };

    const currentDttm: string = getDttmFromDate(currentDate);

    const partialEntity = {
      procDate: currentDttm.substr(0, 8),
      procTime: currentDttm.substr(8, 6),
      lastModifiedDttm: currentDttm
    }

    await this.ordersRepository.update(criteria, partialEntity);
  }

  async testFunc(): Promise<any> {
    return this.updateEbayTrackingNo(StoreType.HAB, '154186357617-2159375506005', '9400111899560770389883', true);
  }
}
