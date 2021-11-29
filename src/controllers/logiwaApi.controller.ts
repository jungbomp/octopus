import { Body, Controller, Get, Header, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
import { LogiwaService } from 'src/services/logiwa.service';
import { LogiwaAvailableToPromiseReportSearchDto } from 'src/models/dto/logiwaAvailableToPromiseReportSearch.dto';
import { LogiwaInventoryitemSearchDto } from 'src/models/dto/logiwaInventoryItemSearch.dto';
import { LogiwaItemChannelListingSearchDto } from 'src/models/dto/logiwaItemChannelListingSearch.dto';
import { LogiwaLocationBasedInventoryDto } from 'src/models/dto/logiwaLocationBasedInventory.dto';
import { LogiwaOrderSearchDto } from 'src/models/dto/logiwaOrderSearch.dto';
import { LogiwaShipmentReportSearchDto } from 'src/models/dto/logiwaShipmentReportSearch.dto';
import { getCurrentDttm } from 'src/utils/dateTime.util';

@Controller('logiwa-api')
export class LogiwaApiController {
  constructor(private readonly logiwaService: LogiwaService) {}

  @Post('inventory-item-search')
  inventoryItemSearch(@Body() logiwaInventoryItemSearchDto: LogiwaInventoryitemSearchDto): Promise<any> {
    return this.logiwaService.inventoryItemSearch(logiwaInventoryItemSearchDto);
  }

  @Post('inventory-item-pack-type-search')
  inventoryItemPackTypeSearch(@Query('inventoryItemId') inventoryItemId: string): Promise<any> {
    return this.logiwaService.inventoryItemPackTypeSearch(inventoryItemId);
  }

  @Post('inventory-item-pack-type-get')
  inventoryItemPackTypeGet(@Query('id') id: string): Promise<any> {
    return this.logiwaService.inventoryItemPackTypeGet(id);
  }

  @Get('load-inventory-item-pack-type')
  loadInventoryItemPackType(): Promise<any> {
    return this.logiwaService.loadInventoryItemPackType();
  }

  @Post('location-based-inventory')
  locationBasedInventory(@Body() logiwaLocationBasedInventoryDto: LogiwaLocationBasedInventoryDto): Promise<any> {
    return this.logiwaService.locationBasedInventory(logiwaLocationBasedInventoryDto)
  }

  @Post('available-to-promise-report-search')
  availableToPromiseReportSearch(@Body() logiwaAvailableToPromiseReportSearchDto: LogiwaAvailableToPromiseReportSearchDto): Promise<any> {
    return this.logiwaService.availableToPromiseReportSearch(logiwaAvailableToPromiseReportSearchDto)
  }

  @Post('all-available-to-promise-report-list')
  allAvailableToPromiseReportList(): Promise<any> {
    return this.logiwaService.getAllAvailableToPromiseReportList();
  }

  @Post('inventory-item-item-channel-ids-search')
  logiwaInventoryItemItemChannelIDsSearch(@Body() logiwaItemChannelListingSearchDto: LogiwaItemChannelListingSearchDto): Promise<any> {
    return this.logiwaService.inventoryItemItemChannelIDsSearch(logiwaItemChannelListingSearchDto);
  }

  @Post('inventory-item-item-channel-ids-delete')
  logiwaInventoryItemItemChannelIDsDelete(@Body() ids: string[]): Promise<any> {
    return this.logiwaService.inventoryItemItemChannelIDsDelete(ids);
  }

  @Post('warehouse-order-search')
  logiwaWarehouseOrderSearch(@Body() LogiwaOrderSearchDto: LogiwaOrderSearchDto): Promise<any> {
    return this.logiwaService.warehouseOrderSearch(LogiwaOrderSearchDto);
  }

  @Post('shipment-report-all-search')
  logiwaShipmentReportAllSearch(@Body() logiwaShipmentReportSearchDto: LogiwaShipmentReportSearchDto): Promise<any> {
    return this.logiwaService.shipmentReportAllSearch(logiwaShipmentReportSearchDto);
  }

  @Get('export-inventory-items')
  @Header('Content-type', 'text/tsv')
  exportLogiwaInventoryItemsTSV(@Res() res: Response): Promise<void> {
    const responseFileName = `logiwa_inventory_items_${getCurrentDttm()}.tsv`;
    res.setHeader('Content-Disposition', `attachment; filename=${responseFileName}`);
    this.logiwaService.exportLogiwaInventoryItemsTSV().then((readable: Readable) => readable.pipe(res));
    return;
  }

  @Get('export-channel-items/:channelId?')
  @Header('Content-type', 'text/tsv')
  exportLogiwaChannelItemsTSV(@Res() res: Response, @Param('channelId') channelId: string): Promise<void> {
    const responseFileName = `logiwa_channel_items_${getCurrentDttm()}.tsv`;
    res.setHeader('Content-Disposition', `attachment; filename=${responseFileName}`);
    this.logiwaService.exportLogiwaChannelItemsTSV(channelId && Number(channelId)).then((readable: Readable) => readable.pipe(res));
    return;
  }
}
