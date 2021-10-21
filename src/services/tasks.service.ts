import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';

import { ClockInService } from './clockIn.service';
import { InterchangeableGroupsService } from './interchangeableGroups.service';
import { InventoriesService } from './inventories.service';
import { ListingsService } from './listings.service';
import { OrdersService } from './orders.service';
import { ProductBundlesService } from './productBundles.service';

import { LogiwaInventoryitemSearchDto } from '../models/dto/logiwaInventoryItemSearch.dto';
import { LogiwaOrderSearchDto } from '../models/dto/logiwaOrderSearch.dto'
import { Orders } from '../models/orders.entity';

import { getCurrentDate, getDttmFromDate, subtractDate } from '../utils/dateTime.util';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly clockInService: ClockInService,
    private readonly interchangeableGroupsService: InterchangeableGroupsService,
    private readonly inventoriesService: InventoriesService,
    private readonly listingsService: ListingsService,
    private readonly ordersService: OrdersService,
    private readonly productBundlesService: ProductBundlesService,
  ) {}

  @Cron('0 5 1 * * 1')
  createClockInGoogleSheet(): void {
    this.logger.log('triggered createClockInGoogleSheet');
    // this.clockInService.createNewClockInGoogleSheetIfNewDate();
  }

  @Cron('0 0 0 * * *')
  loadInventoryFromLogiwa(): void {
    this.logger.log(`triggered loadInventoryFromLogiwa`);
    // this.inventoriesService.loadInventoryDataFromLogiwa({})
    //   .then(() => this.listingsService.loadListingDataFromLogiwa({}))
    //   .then(() => this.interchangeableGroupsService.updateInterchangeableQuantities())
    //   .then(() => this.listingsService.updateAllAvailableQuantityToChannel())
    //   .then(() => this.productBundlesService.updateAllProductBundleQuantity());
  }

  @Cron('0 0 2-23 * * *')
  updateListingQuantity(): void {
    this.logger.log(`triggered updateListingQuantity`);
    const currentDate = getCurrentDate();
    const threeHoursBefore = subtractDate(currentDate, 0, 4, 0, 0);
    const oneDayBefore = subtractDate(currentDate, 1, 0, 0, 0);

    const logiwaOrderSearchDto = new LogiwaOrderSearchDto(0);
    logiwaOrderSearchDto.lastModifiedDateStart = getDttmFromDate(threeHoursBefore);
    logiwaOrderSearchDto.lastModifiedDateEnd = getDttmFromDate(currentDate);

    // this.ordersService.loadOrderDataFromLogiwa(logiwaOrderSearchDto)
    //   .then((orders: Orders[]) => {
    //     this.ordersService.updateTrackingToChannel(oneDayBefore, getCurrentDate());
    //     this.inventoriesService.loadInventoryDataFromLogiwaByOrderedItem(orders)
    //       .then(() => this.interchangeableGroupsService.updateInterchangeableQuantities())
    //       .then(() => this.productBundlesService.updateAllProductBundleQuantity())
    //       .then(() => this.listingsService.updateQuantityToChannelForOrdered(orders))
    //       .then(() => {
    //         if (orders.length > 0) {
    //           const [firstOrder] = orders;

    //           const orderDateStart = orders.reduce(
    //             (orderDate: string, order: Orders) =>
    //               orderDate.localeCompare(order.orderDate) < 0 ? orderDate : order.orderDate,
    //               firstOrder.orderDate
    //           );

    //           const orderDateEnd = orders.reduce(
    //             (orderDate: string, order: Orders) =>
    //               orderDate.localeCompare(order.orderDate) < 0 ? order.orderDate : orderDate,
    //               firstOrder.orderDate
    //           );
    //           this.ordersService.updateZipCode({ orderDateStart: `${orderDateStart}000000`, orderDateEnd: `${orderDateEnd}235959` });
    //         }
    //       })
    //   });
  }

  @Cron('0 0,30 * * * *')
  updateAllAvailableQuantityToChannel(): void {
    this.logger.log(`triggered updateAllAvailableQuantityToChannel`);
    const currentDate = getCurrentDate();
    const yesterDay: Date = subtractDate(currentDate, 1, 0, 0, 0);
    const logiwaInventoryitemSearchDto: LogiwaInventoryitemSearchDto = {
      lastModifiedDateStart: getDttmFromDate(yesterDay) // yyyymmddhh24miss
    };
    // this.inventoriesService.loadInventoryDataFromLogiwa(logiwaInventoryitemSearchDto)
    //   .then(() => this.interchangeableGroupsService.updateInterchangeableQuantities())
    //   .then(() => this.listingsService.updateAllAvailableQuantityToChannel());
  }

  // @Interval(10000)
  // handleInterval() {
  //   this.logger.debug('Called every 10 seconds');
  // }

  // @Timeout(5000)
  // handleTimeout() {
  //   this.logger.debug('Called once after 5 seconds');
  // }
}
