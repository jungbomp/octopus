import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { ClockInService } from './clockIn.service';
import { InventoriesService } from './inventories.service';
import { OrdersService } from './orders.service';
import { LogiwaOrderSearchDto } from '../models/dto/logiwaOrderSearch.dto'
import { DateTimeUtil, getCurrentDate, getDttmFromDate, subtractDate } from 'src/utils/dateTime.util';
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
    private readonly dateTimeUtil: DateTimeUtil,
  ) {}

  @Cron('0 5 1 * * 1')
  async createClockInGoogleSheet(): Promise<void> {
    this.logger.log('triggered createClockInGoogleSheet');
    // const fileId = await this.clockInService.createNewClockInGoogleSheetIfNewDate();
  }

  @Cron('0 50 1-23/3 * * *')
  async loadOrderDataFromLogiwa(): Promise<void> {
    this.logger.log(`triggered loadDataFromLogiwa`);
    const currentDate = this.dateTimeUtil.getCurrentDate();
    const threeHoursBefore = this.dateTimeUtil.subtractDate(currentDate, 0, 3, 10, 0);
    const oneDayBefore = this.dateTimeUtil.subtractDate(currentDate, 1, 0, 0, 0);

    const logiwaOrderSearchDto = new LogiwaOrderSearchDto(0);
    logiwaOrderSearchDto.lastModifiedDateStart = this.dateTimeUtil.getDttmFromDate(threeHoursBefore);
    logiwaOrderSearchDto.lastModifiedDateEnd = getDttmFromDate(currentDate);
    // await this.ordersService.loadOrderDataFromLogiwa(logiwaOrderSearchDto)
    //   .then(async () => await this.ordersService.updateTrackingToChannel(oneDayBefore, currentDate));
  }

  @Cron('0 0 19 * * *')
  async loadInventoryFromLogiwa(): Promise<void> {
    this.logger.log(`triggered loadInventoryFromLogiwa`);

    const yesterDay: Date = subtractDate(getCurrentDate(), 1, 0, 0, 0);
    const logiwaInventoryitemSearchDto: LogiwaInventoryitemSearchDto = {
      lastModifiedDateStart: getDttmFromDate(yesterDay) // yyyymmddhh24miss
    };
    // await this.inventoriesService.loadInventoryDataFromLogiwa(logiwaInventoryitemSearchDto).then(() =>
    //   this.listingsService.loadListingDataFromLogiwa({}));
  }

  @Cron('0 0,30 * * * *')
  async updateListingQuantity(): Promise<void> {
    this.logger.log(`triggered updateListingQuantity`);
    const currentDate = this.dateTimeUtil.getCurrentDate();
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
