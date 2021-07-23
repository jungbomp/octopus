import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { ClockInService } from './clockIn.service';
import { InventoriesService } from './inventories.service';
import { OrdersService } from './orders.service';
import { LogiwaOrderSearchDto } from '../models/dto/logiwaOrderSearch.dto'
import { getCurrentDate, getDttmFromDate, subtractDate } from 'src/utils/dateTime.util';
import { LogiwaInventoryitemSearchDto } from 'src/models/dto/logiwaInventoryItemSearch.dto';
import { ListingsService } from './listings.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly clockInService: ClockInService,
    private readonly inventoriesService: InventoriesService,
    private readonly listingsService: ListingsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Cron('0 5 1 * * 1')
  createClockInGoogleSheet(): void {
    this.logger.log('triggered createClockInGoogleSheet');
    // this.clockInService.createNewClockInGoogleSheetIfNewDate();
  }

  @Cron('0 50 1-23/3 * * *')
  loadOrderDataFromLogiwa(): void {
    this.logger.log(`triggered loadDataFromLogiwa`);
    const currentDate = getCurrentDate();
    const threeHoursBefore = subtractDate(currentDate, 0, 3, 10, 0);
    const oneDayBefore = subtractDate(currentDate, 1, 0, 0, 0);

    const logiwaOrderSearchDto = new LogiwaOrderSearchDto(0);
    logiwaOrderSearchDto.lastModifiedDateStart = getDttmFromDate(threeHoursBefore);
    logiwaOrderSearchDto.lastModifiedDateEnd = getDttmFromDate(currentDate);
    // this.ordersService.loadOrderDataFromLogiwa(logiwaOrderSearchDto)
    //   .then(() => this.ordersService.updateTrackingToChannel(oneDayBefore, getCurrentDate()));
  }

  @Cron('0 0 19 * * *')
  loadInventoryFromLogiwa(): void {
    this.logger.log(`triggered loadInventoryFromLogiwa`);

    const yesterDay: Date = subtractDate(getCurrentDate(), 1, 0, 0, 0);
    const logiwaInventoryitemSearchDto: LogiwaInventoryitemSearchDto = {
      lastModifiedDateStart: getDttmFromDate(yesterDay) // yyyymmddhh24miss
    };
    // this.inventoriesService.loadInventoryDataFromLogiwa(logiwaInventoryitemSearchDto)
    //   .then(() => this.listingsService.loadListingDataFromLogiwa({}));
  }

  @Cron('0 0,30 * * * *')
  updateListingQuantity(): void {
    this.logger.log(`triggered updateListingQuantity`);
    const currentDate = getCurrentDate();
    const thirtyMinutesBefore = subtractDate(currentDate, 0, 0, 31, 0);
    // this.listingsService.updateQuantityToChannel(thirtyMinutesBefore, currentDate);
  }

  @Cron('0 15 5,18 * * *')
  updateAllAvailableQuantityToChannel(): void {
    this.logger.log(`triggered updateAllAvailableQuantityToChannel`);
    // this.listingsService.updateAllAvailableQuantityToChannel();
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
