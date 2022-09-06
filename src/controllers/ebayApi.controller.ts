import { Body, Controller, Get, Header, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { EbayApiGetOrdersDto } from '../models/dto/ebayApiGetOrders.dto';
import { EbayApiService } from '../services/ebayApi.service';
import { EbayApiBulkUpdatePriceQuantityDto } from 'src/models/dto/ebayApiBulkUpdatePriceQuantity.dto';
import { EbayApiCreateShippingFulfillmentDto } from 'src/models/dto/ebayApiCreateShippingFulfillment.dto';
import { StoreType } from 'src/types';
import { getCurrentDttm } from 'src/utils/dateTime.util';
import internal from 'stream';

@Controller('ebay-api/:store')
export class EbayApiController {
  constructor(private readonly ebayApiService: EbayApiService) {}

  @Get('inventory-item/:sku')
  getInventoryItem(@Param('store') store: StoreType, @Param('sku') sku: string): Promise<any> {
    return this.ebayApiService.getInventoryItem(store, sku);
  }

  @Get('inventory-items')
  getInventoryItems(
    @Param('store') store: StoreType,
    @Query('limit') limit: string,
    @Query('offset') offset: string
  ): Promise<any> {
    return this.ebayApiService.getInventoryItems(store, limit && Number(limit), offset && Number(offset));
  }

  @Get('export-all-inventory-items')
  @Header('Content-type', 'text/tsv')
  exportAllInventoryItems(@Param('store') store: StoreType, @Res() res: Response): Promise<void> {
    const tsvFileName = `ebay_inventory_items_${store}_${getCurrentDttm()}.tsv`;
    res.setHeader('Content-Disposition', `attachment; filename=${tsvFileName}`);
    this.ebayApiService.exportAllInventoryItems(store).then((readable: internal.Readable) => readable.pipe(res));
    return;
  }

  @Post('bulk-migrate-listing')
  bulkMigrateListing(@Param('store') store: StoreType, @Body() listingIds: string[]): Promise<any> {
    return this.ebayApiService.bulkMigrateListing(store, listingIds);
  }

  @Post('migrate')
  migrate(@Param('store') store: StoreType, @Body() listingIds: string[]): Promise<any> {
    return this.ebayApiService.migrate(store, listingIds);
  }

  @Post('bulk-update-price-quantity')
  bulkUpdatePriceQuantity(
    @Param('store') store: StoreType,
    @Body() bulkUpdatePriceQuantityDtos: EbayApiBulkUpdatePriceQuantityDto[]
  ): Promise<any> {
    return this.ebayApiService.bulkUpdatePriceQuantity(store, bulkUpdatePriceQuantityDtos);
  }

  @Get('shipping-fulfillments/:orderId')
  getShippingFulfillments(@Param('store') store: StoreType, @Param('orderId') orderId: string): Promise<any> {
    return this.ebayApiService.getShippingFulfillments(store, orderId);
  }

  @Post('shipping-fulfillment')
  createShippingFulfillment(
    @Param('store') store: StoreType,
    @Body() ebayApiCreateShippingFulfillmentDto: EbayApiCreateShippingFulfillmentDto
  ): Promise<any> {
    return this.ebayApiService.createShippingFulfillment(store, ebayApiCreateShippingFulfillmentDto);
  }

  @Get('order/:orderId')
  getOrder(@Param('store') store: StoreType, @Param('orderId') orderId: string): Promise<any> {
    return this.ebayApiService.getOrder(store, orderId);
  }

  @Post('get-orders')
  getOrders(@Param('store') store: StoreType, @Body() ebayApiGetOrdersDto: EbayApiGetOrdersDto): Promise<any> {
    return this.ebayApiService.getOrders(store, ebayApiGetOrdersDto);
  }
}
