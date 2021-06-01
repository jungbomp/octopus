import { Body, Controller, Get, Header, Param, Put, Res } from '@nestjs/common';
import { Response } from 'express';
import { WalmartApiService } from 'src/services/walmartApi.service';
import { WalmartApiUpdateInventoryDto } from 'src/models/dto/wamartApiUpdateInventory.dto';
import { StoreType } from 'src/types';
import { getCurrentDttm } from 'src/utils/dateTime.util';
import { Readable } from 'stream';

@Controller('walmart-api/:store')
export class WalmartApiController {
  constructor(private readonly walmartApiService: WalmartApiService) {}

  @Get('inventory/:sku')
  getInventory(@Param('store') store: StoreType, @Param('sku') sku: string): Promise<any> {
    return this.walmartApiService.getInventory(store, sku);
  }

  @Put('inventory')
  updateInventory(@Param('store') store: StoreType, @Body() walmartApiUpdateInventoryDto: WalmartApiUpdateInventoryDto): Promise<any> {
    return this.walmartApiService.updateInventory(store, walmartApiUpdateInventoryDto);
  }

  @Get('feed/:feedId?')
  getFeedStatus(@Param('store') store: StoreType, @Param('feedId') feedId: string): Promise<any> {
    return this.walmartApiService.getFeedStatus(store, feedId);
  }

  @Get('get-items/:nextCursor?')
  walmartGetItems(@Param('store') store: StoreType, @Param('nextCursor') nextCursor?: string): Promise<any> {
    return this.walmartApiService.getItems(store, nextCursor);
  }

  @Get('export-items')
  @Header('Content-type', 'text/tsv')
  exportWalmarteItemsTSV(@Param('store') store: StoreType, @Res() res: Response): Promise<void> {
    const responseFileName = `walmart_items_${getCurrentDttm()}.tsv`;
    res.setHeader('Content-Disposition', `attachment; filename=${responseFileName}`);
    this.walmartApiService.exportWalmarteItemsTSV(store).then((readable: Readable) => readable.pipe(res));
    return;
  }
}
