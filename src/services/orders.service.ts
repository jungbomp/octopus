import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  UpdateResult,
} from 'typeorm';

import { AmazonSPFulfillmentCarrierCode, ChannelType, MarketType, StoreType } from 'src/types';
import { findChannelTypeFromChannelId, findMarketId, findStoreType, toChannelTypeFromMarketId, toStoreTypeFromMarketId } from 'src/utils/types.util';
import { DateTimeUtil, getCurrentDate, getDttmFromDate } from 'src/utils/dateTime.util';

import { EbayApiService } from './ebayApi.service';
import { InventoriesService } from './inventories.service';
import { LogiwaService } from './logiwa.service';
import { MarketsService } from './markets.service';
import { UsersService } from './users.service';
import { WalmartApiService } from './walmartApi.service';

import { AmazonSPApiUpdateOrderFulfillmentRequest } from '../models/amazonSP/amazonSPApiUpdateOrderFulfillmentRequest';
import { AmazonSPApiCreateFeedResponse } from '../models/amazonSP/amazonSPApiCreateFeedResponse';
import { CreateOrderDto } from '../models/dto/createOrder.dto';
import { CreateOrderItemDto } from '../models/dto/createOrderItem.dto';
import { EbayApiCreateShippingFulfillmentDto } from '../models/dto/ebayApiCreateShippingFulfillment.dto';
import { LogiwaOrderSearchDto } from '../models/dto/logiwaOrderSearch.dto';
import { SalesBySkuDto } from '../models/dto/salesBySku.dto';
import { LogiwaShipmentReportSearchDto } from '../models/dto/logiwaShipmentReportSearch.dto';
import { Market } from '../models/market.entity';
import { OrderItem } from '../models/orderItem.entity';
import { Orders } from '../models/orders.entity';
import { User } from '../models/user.entity';
import { Inventory } from '../models/inventory.entity';
import { AmazonSPApiService } from './amazonSPApi.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly amazonSPApiService: AmazonSPApiService,
    private readonly ebayApiService: EbayApiService,
    private readonly inventoriesService: InventoriesService,
    private readonly logiwaService: LogiwaService,
    private readonly marketsService: MarketsService,
    private readonly usersService: UsersService,
    private readonly walmartApiService: WalmartApiService,
    private readonly dateTimeUtil: DateTimeUtil
  ) { }

  async findAll(includeOrderItems?: boolean, marketId?: number, orderDateStart?: string, orderDateEnd?: string): Promise<Orders[]> {
    const option = {};

    if (marketId) {
      option['market'] = { marketId };
    }

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

    return this.ordersRepository.find(
      includeOrderItems
      ? {
        relations: ['orderItems'],
        where: option,
      }
      : option
    );
  }

  async find(channelOrderCode: string, marketId?: number, includeOrderItems?: boolean): Promise<Orders[]> {
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

  async findOne(channelOrderCode: string, marketId: number, includeOrderItems?: boolean): Promise<Orders> {
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

  async findUnProcessed(orderDateStart?: string, orderDateEnd?: string, includeOrderItems?: boolean): Promise<Orders[]> {
    const orders: Orders[] = await this.findAll(includeOrderItems, undefined, orderDateStart, orderDateEnd);
    return orders.filter((order: Orders): boolean => (order.procDate || '').length === 0 );
  }

  async findByLastModifiedDate(dateStart: string, dateEnd: string, includeOrderItems?: boolean): Promise<Orders[]> {
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

  async updateOrdersProcDttm(channelOrderCode: string, marketId: number, procDate: Date): Promise<UpdateResult> {
    const criteria = {
      channelOrderCode,
      market: {
        marketId
      },
    };

    const partialEntity = {
      procDate: this.dateTimeUtil.getDttmFromDate(procDate).substr(0, 8),
      procTime: this.dateTimeUtil.getDttmFromDate(procDate).substr(8, 6),
      lastModifiedDttm: this.dateTimeUtil.getCurrentDttm(),
    };

    return this.ordersRepository.update(criteria, partialEntity);
  }

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

  async getSalesBySku(startDate: string, endDate: string): Promise<SalesBySkuDto[]> {
    const orders: Orders[] = await this.findAll(true, undefined, startDate, endDate);

    const map = new Map<string, SalesBySkuDto>();

    orders.forEach((order: Orders) => {
      order.orderItems.forEach((orderItem: OrderItem) => {
        const key = `${order.orderDate}-${orderItem.inventory?.stdSku}`;

        const salesBySku: SalesBySkuDto =
          map.get(key) ??
          this.buildSalesBySkuDto({
            orderDate: order.orderDate,
            productCode: orderItem.inventory?.product?.productCode,
            stdSku: orderItem.inventory?.stdSku,
            listingSku: orderItem.listingSku,
            productName: orderItem.inventory?.productName,
          });

        switch (order.market.marketId) {
          case MarketType.HAB_AMAZON:
            salesBySku.hbAmazonQuantity += orderItem.unitQuantity;
            break;
          case MarketType.HAB_EBAY:
            salesBySku.hbEbayQuantity += orderItem.unitQuantity;
            break;
          case MarketType.HAB_SEARS:
            salesBySku.hbSearsQuantity += orderItem.unitQuantity;
            break;
          case MarketType.HAB_WALMART:
            salesBySku.hbWalmartQuantity += orderItem.unitQuantity;
            break;
          case MarketType.HAB_SHOPIFY:
            salesBySku.hbShopifyQuantity += orderItem.unitQuantity;
            break;
          case MarketType.MA_AMAZON:
            salesBySku.mxAmazonQuantity += orderItem.unitQuantity;
            break;
          case MarketType.MA_EBAY:
            salesBySku.mxEbayQuantity += orderItem.unitQuantity;
            break;
          case MarketType.MA_WALMART:
            salesBySku.mxWalmartQuantity += orderItem.unitQuantity;
            break;
          default:
            break;
        }

        salesBySku.totalQuantity += orderItem.unitQuantity;
        map.set(key, salesBySku);
      });
    });

    return [...map.values()];
  }

  async loadFromLogiwa(searchDto: LogiwaOrderSearchDto): Promise<any> {
    this.loadOrderDataFromLogiwa(searchDto);

    return { Success: true };
  }

  async loadOrderDataFromLogiwa(searchDto: LogiwaOrderSearchDto): Promise<Orders[]> {
    this.logger.log('load order data from logiwa');
    let loadedCnt = 0;
    const startDate: Date = getCurrentDate();

    while (true) {
      searchDto.selectedPageIndex = (searchDto.selectedPageIndex || 0) + 1;

      const { Data: logiwaOrders } = await this.logiwaService.warehouseOrderSearch(searchDto);
      if ((logiwaOrders ?? []).length < 1) {
        break;
      }

      const createOrders: CreateOrderDto[] = await Promise.all(
        logiwaOrders.filter((logiwaOrder: any) => (logiwaOrder.ChannelOrderCode || '').length > 0)
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
                  createOrderItemDto.garmentCost = createOrderItemDto.stdSku ?
                    await this.inventoriesService.findOne(createOrderItemDto.stdSku)
                      .then((inventory: Inventory) => inventory?.garmentCost ?? 0)
                    : 0;
                  return createOrderItemDto;
                }));

            const createOrderDto = new CreateOrderDto();
            createOrderDto.channelOrderCode = logiwaOrder.ChannelOrderCode;
            createOrderDto.marketId = findMarketId(channel, store);
            createOrderDto.orderDate = this.logiwaService.toDateStringFromLogiwaDateFormat(logiwaOrder.OrderDate).substring(0, 8);
            createOrderDto.orderQty = logiwaOrder.DetailInfo.reduce((acc: number, cur: any): number => acc + cur.PackQuantity, 0);
            createOrderDto.orderPrice = logiwaOrder.TotalSalesGrossPrice;
            createOrderDto.orderShippingPrice = logiwaOrder.CarrierRate;
            createOrderDto.trackingNo = logiwaOrder.CarrierTrackingNumber.trim().length > 0 ? logiwaOrder.CarrierTrackingNumber : null;
            createOrderDto.orderItems = orderItems.reduce((acc: CreateOrderItemDto[], cur: CreateOrderItemDto): CreateOrderItemDto[] => {
              const item = acc.find((item) => item.listingSku === cur.listingSku);
              if ((item || null) !== null) {
                item.unitQuantity = item.unitQuantity + 1;
              } else {
                acc.push(cur);
              }
              return acc;
            }, []);

            return createOrderDto;
          })
      );

      try {
        const created = await this.createBatch(createOrders);
        this.logger.log(
          `Page Done ${searchDto.selectedPageIndex}/${logiwaOrders[0].PageCount} with ${created} orders`
        );
        loadedCnt += created;
      } catch {
        this.logger.log(`Failed to update orders on page {searchDto.selectedPageIndex}/${logiwaOrders[0].PageCount}`);
      }
      
      if (searchDto.selectedPageIndex === logiwaOrders[0].PageCount) {
        break;
      }
    }

    if (loadedCnt > 0) {
      return await this.findByLastModifiedDate(getDttmFromDate(startDate), getDttmFromDate(getCurrentDate()), true);
    }
  }

  async updateTrackingToChannel(dateStart: Date, dateEnd: Date): Promise<void> {
    this.logger.log('Update tracking info to each channel between');
    this.logger.log(`${dateStart} and ${dateEnd}`);

    const orders: Orders[] = await this.findByLastModifiedDate(this.dateTimeUtil.getDttmFromDate(dateStart), this.dateTimeUtil.getDttmFromDate(dateEnd));
    const filteredOrders: Orders[] = orders.filter((order: Orders) => (order.trackingNo || '').length > 0 && (order.procDate || '').length === 0);

    this.logger.log(`Starting to update tracking number to each channel with ${filteredOrders.length} orders`);
    const amazonHabUpdateOrderFulfillmentRequests: AmazonSPApiUpdateOrderFulfillmentRequest[] = [];
    const amazonMaUpdateOrderFulfillmentRequests: AmazonSPApiUpdateOrderFulfillmentRequest[] = [];

    for (let i = 0; i < filteredOrders.length; i++) {
      const order: Orders = filteredOrders[i];
      const channelType: ChannelType = toChannelTypeFromMarketId(order.market.marketId);
      const storeType = toStoreTypeFromMarketId(order.market.marketId);

      try {
        switch (channelType) {
          case ChannelType.AMAZON:
            const updateOrderFulfillmentRequest: AmazonSPApiUpdateOrderFulfillmentRequest = {
              amazonOrderId: order.channelOrderCode,
              fulfillmentDate: getCurrentDate().toISOString(),
              carrierCode: AmazonSPFulfillmentCarrierCode.USPS,
              shippingMethod: 'USPS - First-Class Mail',
              shipperTrackingNumber: order.trackingNo,
            }

            if (storeType === StoreType.HAB) {
              amazonHabUpdateOrderFulfillmentRequests.push(updateOrderFulfillmentRequest);
            } else {
              amazonMaUpdateOrderFulfillmentRequests.push(updateOrderFulfillmentRequest);
            }
            break;

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

    this.updateAmazonTrackingNo(StoreType.HAB, amazonHabUpdateOrderFulfillmentRequests);
    this.updateAmazonTrackingNo(StoreType.MA, amazonMaUpdateOrderFulfillmentRequests);

    this.logger.log(`Completed to update tracking number to each channel`);
  }

  async updateZipCode(searchDto: LogiwaShipmentReportSearchDto): Promise<any> {
    this.updateZipcodeFromLogiwa(searchDto);

    return { Success: true };
  }

  private async updateZipcodeFromLogiwa(searchDto: LogiwaShipmentReportSearchDto): Promise<any> {
    this.logger.log('Update zipcode from logiwa');

    while (true) {
      searchDto.selectedPageIndex = (searchDto.selectedPageIndex || 0) + 1;

      const { Data: logiwaShipmentReports } = await this.logiwaService.shipmentReportAllSearch(searchDto);
      if ((logiwaShipmentReports ?? []).length < 1) {
        break;
      }

      const createOrders: CreateOrderDto[] = await Promise.all(
        logiwaShipmentReports.filter((shippingReport: any) => (shippingReport.ChannelOrderCode || '').length > 0 && (shippingReport.Zipcode || '').length > 0)
          .map(async (shippingReport: any): Promise<CreateOrderDto> => {
            const [order]: Orders[] = await this.find(shippingReport.ChannelOrderCode, undefined, true);

            const createOrderDto = new CreateOrderDto();
            createOrderDto.channelOrderCode = order.channelOrderCode;
            createOrderDto.marketId = order.market.marketId;
            createOrderDto.orderDate = order.orderDate;
            createOrderDto.orderQty = order.orderQty;
            createOrderDto.orderPrice = order.orderPrice;
            createOrderDto.orderShippingPrice = order.orderShippingPrice;
            createOrderDto.trackingNo = order.trackingNo;
            createOrderDto.zipcode = shippingReport.Zipcode;
            createOrderDto.orderItems = order.orderItems
              .filter((orderItem: OrderItem) => orderItem.inventory?.stdSku !== undefined)
              .map((orderItem: OrderItem) => {
                const createOrderItemDto = new CreateOrderItemDto();
                createOrderItemDto.channelOrderCode = order.channelOrderCode;
                createOrderItemDto.marketId = order.market.marketId;
                createOrderItemDto.listingSku = orderItem.listingSku;
                createOrderItemDto.stdSku = orderItem.inventory.stdSku;
                createOrderItemDto.unitPrice = orderItem.unitPrice;
                createOrderItemDto.unitQuantity = orderItem.unitQuantity;
                createOrderItemDto.garmentCost = orderItem.garmentCost;

                return createOrderItemDto;
              });

            return createOrderDto;
          })
      );

      try {
        const created = await this.createBatch(createOrders);
        this.logger.log(
          `Page Done ${searchDto.selectedPageIndex}/${logiwaShipmentReports[0].PageCount} with ${created} shipment reports`
        );
      } catch {
        this.logger.log(`Failed to update zipcode on page {searchDto.selectedPageIndex}/${logiwaShipmentReports[0].PageCount}`);
      }

      if (searchDto.selectedPageIndex === logiwaShipmentReports[0].PageCount) {
        break;
      }
    }
  }

  private async updateAmazonTrackingNo(store: StoreType, updateOrderFulfillmentRequests: AmazonSPApiUpdateOrderFulfillmentRequest[]): Promise<void> {
    this.logger.log(`updateAmazonTrackingNo ${store} tracking number with ${updateOrderFulfillmentRequests.length} orders`);
    if (updateOrderFulfillmentRequests.length > 0) {
      const createFeedResponse: AmazonSPApiCreateFeedResponse|string = await this.amazonSPApiService.updateOrderFulfillmentTracking(store, updateOrderFulfillmentRequests);

      if ((createFeedResponse as AmazonSPApiCreateFeedResponse).payload?.feedId) {
        const procDate = getCurrentDate();

        updateOrderFulfillmentRequests.forEach(({ amazonOrderId }: AmazonSPApiUpdateOrderFulfillmentRequest) => {
          this.updateOrdersProcDttm(amazonOrderId, findMarketId(ChannelType.AMAZON, store), procDate)
        });
      }
    }
  }

  private async updateWalmartTrackingNo(store: StoreType, channelOrderCode: string, trackingNo: string): Promise<void> {
    const response = await this.walmartApiService.updateOrder(channelOrderCode, store, trackingNo);

    if (response.order) {
      const orderDate = new Date(
        response.order.orderLines.orderLine[0].orderLineStatuses.orderLineStatus[0].trackingInfo.shipDateTime
      );

      const marketId: number = findMarketId(ChannelType.WALMART, store);
      await this.updateOrdersProcDttm(channelOrderCode, marketId, orderDate);
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

    await this.updateOrdersProcDttm(channelOrderCode, findMarketId(ChannelType.EBAY, store), getCurrentDate());
  }

  private buildSalesBySkuDto = (props: Partial<SalesBySkuDto>): SalesBySkuDto => ({
    orderDate: props.orderDate || '',
    productCode: props.productCode || '',
    stdSku: props.stdSku || '',
    listingSku: props.listingSku || '',
    productName: props.productName || '',
    totalQuantity: props.totalQuantity || 0,
    hbAmazonQuantity: props.hbAmazonQuantity || 0,
    hbEbayQuantity: props.hbEbayQuantity || 0,
    hbSearsQuantity: props.hbSearsQuantity || 0,
    hbWalmartQuantity: props.hbWalmartQuantity || 0,
    hbShopifyQuantity: props.hbShopifyQuantity || 0,
    mxAmazonQuantity: props.mxAmazonQuantity || 0,
    mxEbayQuantity: props.mxEbayQuantity || 0,
    mxWalmartQuantity: props.mxWalmartQuantity || 0,
  })
}
