import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LogiwaOrderSearchDto } from '../models/dto/logiwaOrderSearch.dto';
import { CreateOrderDto } from '../models/dto/createOrder.dto';
import { SalesBySkuDto } from '../models/dto/salesBySku.dto';
import { Orders } from '../models/orders.entity';
import { OrdersService } from '../services/orders.service';
import { toDateFromDateString } from 'src/utils/dateTime.util';
import { LogiwaShipmentReportSearchDto } from 'src/models/dto/LogiwaShipmentReportSearch.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query('includeOrderItems') includeOrderItems?: string, @Query('marketId') marketId?: string, @Query('orderDateStart') orderDateStart?: string, @Query('orderDateEnd') orderDateEnd?: string): Promise<Orders[]> {
    return this.ordersService.findAll(includeOrderItems?.toLowerCase() === 'true', marketId && Number(marketId), orderDateStart, orderDateEnd);
  }

  @Get('un-processed')
  findUnProcessed(@Query('orderDateStart') orderDateStart: string, @Query('orderDateEnd') orderDateEnd: string, @Query('includeOrderItems') includeOrderItems: string): Promise<Orders[]> {
    return this.ordersService.findUnProcessed(orderDateStart, orderDateEnd, includeOrderItems?.toLowerCase() === 'true');
  }

  @Get('last-modified-date')
  findByLastModifiedDate(@Query('orderDateStart') orderDateStart: string, @Query('orderDateEnd') orderDateEnd: string, @Query('includeOrderItems') includeOrderItems: string): Promise<Orders[]> {
    return this.ordersService.findByLastModifiedDate(orderDateStart, orderDateEnd, includeOrderItems?.toLowerCase() === 'true');
  }

  @Get('sales-by-sku')
  salesBySku(@Query('orderDateStart') orderDateStart: string, @Query('orderDateEnd') orderDateEnd: string): Promise<SalesBySkuDto[]> {
    return this.ordersService.getSalesBySku(orderDateStart, orderDateEnd);
  }

  @Get(':ChannelOrderCode/:marketId')
  findOne(@Param('ChannelOrderCode') ChannelOrderCode: string, @Param('marketId') marketId: string, @Query('includeOrderItems') includeOrderItems: string): Promise<Orders> {
    return this.ordersService.findOne(ChannelOrderCode, Number(marketId), includeOrderItems?.toLowerCase() === 'true');
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto): Promise<Orders> {
    return this.ordersService.create(createOrderDto);
  }

  @Post('update-tracking-to-channel')
  updateTrackingToChannel(@Query('startDate') startDate: string, @Query('endDate') endDate: string): Promise<any> {
    return this.ordersService.updateTrackingToChannel(toDateFromDateString(startDate), toDateFromDateString(endDate));
  }

  @Post('update-zip-code')
  updateZipCode(@Body() logiwaShipmentReportSearchDto: LogiwaShipmentReportSearchDto): Promise<any> {
    return this.ordersService.updateZipCode(logiwaShipmentReportSearchDto);
  }

  @Post('load-logiwa')
  loadFromLogiwa(@Body() logiwaOrderSearchDto: LogiwaOrderSearchDto): Promise<any> {
    return this.ordersService.loadFromLogiwa(logiwaOrderSearchDto);
  }
}
