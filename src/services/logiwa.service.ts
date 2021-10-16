import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createWriteStream, existsSync, readFileSync } from 'fs';
import { Readable } from 'stream';
import { LogiwaAvailableToPromiseReportSearchDto } from 'src/models/dto/logiwaAvailableToPromiseReportSearch.dto';
import { LogiwaInventoryitemSearchDto } from 'src/models/dto/logiwaInventoryItemSearch.dto';
import { LogiwaItemChannelListingSearchDto } from 'src/models/dto/logiwaItemChannelListingSearch.dto';
import { LogiwaLocationBasedInventoryDto } from 'src/models/dto/logiwaLocationBasedInventory.dto';
import { LogiwaOrderSearchDto } from 'src/models/dto/logiwaOrderSearch.dto';
import { LogiwaShipmentReportSearchDto } from 'src/models/dto/logiwaShipmentReportSearch.dto';
import { ReceiptDto } from 'src/models/dto/receipt.dto';
import { getCurrentDate, toDateFromDateString, toLogiwaDateFormat } from 'src/utils/dateTime.util';
import { sleep } from 'src/utils/sleep.util';
import { getChannelIds } from 'src/utils/types.util';

@Injectable()
export class LogiwaService {
  private readonly logger = new Logger(LogiwaService.name);
  private readonly apiCallTimePeriod = 1500;

  private tokenObj: { tokenType: string, accessToken: string, expires: Date };
  private apiCallLogs: Date[];
  private inventoryItemIdMap: any;

  private logiwaApiConfig: LogiwaApiConfig;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.logiwaApiConfig = this.configService.get<LogiwaApiConfig>('logiwaApiConfig');
    this.tokenObj = null;
    this.apiCallLogs = [];
    this.inventoryItemIdMap = existsSync(this.logiwaApiConfig.inventoryItemMapFilename) ? JSON.parse(readFileSync(this.logiwaApiConfig.inventoryItemMapFilename, 'utf-8')) : {};
  }

  toDateStringFromLogiwaDateFormat(dateStr: string): string {
    const tokens = dateStr.split(/[.: ]/);
    return `${tokens[2]}${tokens[0]}${tokens[1]}${tokens[3]}${tokens[4]}${tokens[5]}`;
  }

  private async logiwaApiCall(url: string, data: any): Promise<any> {
    const { tokenType, accessToken } = await this.authorize();

    this.flushCallLogs();

    if (this.apiCallLogs.length === Number(this.logiwaApiConfig.numberOfApiCallPerSecond)) {
      const delay: number = this.apiCallTimePeriod - (getCurrentDate().getTime() - this.apiCallLogs[0].getTime());
      this.logger.log(`delay: ${delay}`);
      await sleep(delay);
      this.flushCallLogs();
    }

    this.apiCallLogs.push(getCurrentDate());

    const res = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${tokenType} ${accessToken}`,
      },
      data: JSON.stringify(data),
      validateStatus: (status: number): boolean => status >= 200 && status < 501,
    });

    if (res.status !== 200) {
      this.logger.error(res.data);
      throw new Error(res.statusText);
    }

    if (res.data && !res.data.Success) {
      throw new Error(res.data.SuccessMessage);
    }

    return res.data;
  }

  private flushCallLogs(): void {
    while (this.apiCallLogs.length > 0 && getCurrentDate().getTime() - this.apiCallLogs[0].getTime() > this.apiCallTimePeriod) {
      this.apiCallLogs.shift();
    }
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   */
  private async authorize(): Promise<{ tokenType: string, accessToken: string, expires: Date }> {
    if (this.tokenObj !== null && new Date(Date.now()) < this.tokenObj.expires) {
      return this.tokenObj;
    }
  
    const formBody = [];
    formBody.push(`${encodeURIComponent('grant_type')}=${encodeURIComponent('password')}`);
    formBody.push(`${encodeURIComponent('username')}=${encodeURIComponent(this.logiwaApiConfig.username)}`);
    formBody.push(`${encodeURIComponent('password')}=${encodeURIComponent(this.logiwaApiConfig.password)}`);
  
    const res = await axios({
      method: 'post',
      url: `${this.logiwaApiConfig.baseUrl}/token`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formBody.join('&')
    });

    if (res.status !== 200) {
      throw new Error(res.statusText);
    }

    this.tokenObj = {
      tokenType: res.data.token_type,
      accessToken: res.data.access_token,
      expires: new Date(res.data['.expires'])
    }
  
    return this.tokenObj;
  }

  /**
   * @param selectedPageIndex 
   * @param code stdSku
   * @returns 
   */
  async inventoryItemSearch(logiwaInventoryItemSearchDto: LogiwaInventoryitemSearchDto): Promise<any> {
    const body = {
      'PageSize': logiwaInventoryItemSearchDto.pageSize ?? 200,
      'SelectedPageIndex': logiwaInventoryItemSearchDto.selectedPageIndex ?? 1,
      'Code': logiwaInventoryItemSearchDto.code,
      'ID': logiwaInventoryItemSearchDto.id,
    };

    if (logiwaInventoryItemSearchDto.lastModifiedDate) {
      body['LastModifiedDate'] = toLogiwaDateFormat(toDateFromDateString(logiwaInventoryItemSearchDto.lastModifiedDate));
    }

    if (logiwaInventoryItemSearchDto.lastModifiedDateStart) {
      body['LastModifiedDate_Start'] = toLogiwaDateFormat(toDateFromDateString(logiwaInventoryItemSearchDto.lastModifiedDateStart));
    }

    if (logiwaInventoryItemSearchDto.lastModifiedDateEnd) {
      body['LastModifiedDate_End'] = toLogiwaDateFormat(toDateFromDateString(logiwaInventoryItemSearchDto.lastModifiedDateEnd));
    }

    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/InventoryItemSearch`, body);
  }

  async locationBasedInventory(logiwaLocationBasedInventoryDto: LogiwaLocationBasedInventoryDto): Promise<any> {
    const body = {
      'ItemCode': logiwaLocationBasedInventoryDto.itemCode,
      'PageSize': logiwaLocationBasedInventoryDto.pageSize ?? 200,
      'SelectedPageIndex': logiwaLocationBasedInventoryDto.selectedPageIndex ?? 1,
      'WarehouseID': this.logiwaApiConfig.warehouseId,
      'DepoID': this.logiwaApiConfig.depositorId
    };

    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/GetAvailableStockInfo`, body);
  }

  async availableToPromiseReportSearch(logiwaAvailableToPromiseReportSearchDto: LogiwaAvailableToPromiseReportSearchDto): Promise<any> {
    const body = {
      'Code': logiwaAvailableToPromiseReportSearchDto.code,
      'PageSize': logiwaAvailableToPromiseReportSearchDto.pageSize ?? 200,
      'SelectedPageIndex': logiwaAvailableToPromiseReportSearchDto.selectedPageIndex ?? 1,
      'WarehouseID': this.logiwaApiConfig.warehouseId,
      'DepositorID': this.logiwaApiConfig.depositorId
    };

    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/AvailableToPromiseReportSearch`, body);
  }

  async inventoryItemItemChannelIDsSearch(logiwaItemChannelListingSearchDto: LogiwaItemChannelListingSearchDto): Promise<any> {
    const body = {
      'DepositorID': this.logiwaApiConfig.depositorId,
      'PageSize': logiwaItemChannelListingSearchDto.pageSize ?? 200,
      'SelectedPageIndex': logiwaItemChannelListingSearchDto.selectedPageIndex ?? 1,
      'InventoryItemID': logiwaItemChannelListingSearchDto.inventoryItemId,
      'ChannelID': logiwaItemChannelListingSearchDto.channelId,
      'ChannelItemNumber': logiwaItemChannelListingSearchDto.channelItemNumber,
      'SellerSKU': logiwaItemChannelListingSearchDto.sellerSKU,
    };
  
    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/InventoryItemItemChannelIDsSearch`, body);
  }

  async inventoryItemItemChannelIDsDelete(ids: string[]): Promise<any> {
    const body = {
      'WarehouseID': this.logiwaApiConfig.warehouseId,
      'DepoID': this.logiwaApiConfig.depositorId
    };

    let ret = {};
    for (let i = 0; i < ids.length; i++) {
      body['ID'] = ids[i];
      ret = await this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/InventoryItemItemChannelIDsDelete`, body);
      this.logger.log(`Deleted logiwa inventory channel item ${ids[i]} (${i+1}/${ids.length})`);
    }
  
    return ret;
  }

  /**
   * @param inventoryItemId id string come from inventoryItemSearch result
   * @returns 
   */
  async inventoryItemPackTypeSearch(inventoryItemId?: string): Promise<any> {
    const body = {
      'InventoryItemId': inventoryItemId,
      'WarehouseID': this.logiwaApiConfig.warehouseId,
      'DepoID': this.logiwaApiConfig.depositorId
    };
    
    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/InventoryItemPackTypeSearch`, body);
  }

  /**
   * @param id id string come from inventoryItemPackTypeSearch result
   * @returns 
   */
  async inventoryItemPackTypeGet(id: string): Promise<any> {
    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/InventoryItemPackTypeGet`, { ID: id })
  }

  async warehouseReceiptBulkInsert(receipts: ReceiptDto[]): Promise<{ Success: string, SuccessMessage: string }> {
    const body = receipts.map(receipt => ({
      code: `${receipt.supplier}#${Number(receipt.orderSeq)}`,
      depositor: receipt.depositor,
      warehouse: receipt.warehouse,
      warehouseReceiptType: receipt.warehouseReceiptType,
      receiptDate: toLogiwaDateFormat(toDateFromDateString(receipt.receiptDate)),
      supplier: receipt.supplier,
      supplierAddress: receipt.supplier,
      addressText: receipt.supplier,
      Details: receipt.details.map(item => ({
        itemCode: item.itemCode,
        ItemPackType: item.itemPackType,
        plannedPackQuantity: item.plannedPackQuantity
      }))
    }));

    const { Success, SuccessMessage } = await this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/WarehouseReceiptBulkInsert`, body);
    return { Success, SuccessMessage };
  }

  async warehouseOrderSearch(searchDto: LogiwaOrderSearchDto): Promise<any> {
    const body = {
      WarehouseID: 577,
      IsGetOrderDetails: true,
      PageSize: 200,
      SelectedPageIndex: searchDto.selectedPageIndex,
      OrderDate: searchDto.orderDate ? toLogiwaDateFormat(toDateFromDateString(searchDto.orderDate)) : null,
      OrderDate_Start: searchDto.orderDateStart ? toLogiwaDateFormat(toDateFromDateString(searchDto.orderDateStart)) : null,
      OrderDate_End: searchDto.orderDateEnd ? toLogiwaDateFormat(toDateFromDateString(searchDto.orderDateEnd)) : null,
      LastModifiedDate_Start: searchDto.lastModifiedDateStart ? toLogiwaDateFormat(toDateFromDateString(searchDto.lastModifiedDateStart)) : null,
      LastModifiedDate_End: searchDto.lastModifiedDateEnd ? toLogiwaDateFormat(toDateFromDateString(searchDto.lastModifiedDateEnd)) : null,

      ChannelOrderCode: searchDto.channelOrderCode,
      ChannelID: [searchDto.channelId],
    }

    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/WarehouseOrderSearch`, body);
  }

  async shipmentReportAllSearch(searchDto: LogiwaShipmentReportSearchDto): Promise<any> {
    const body = {
      WarehouseID: 577,
      PageSize: 200,
      SelectedPageIndex: searchDto.selectedPageIndex,
      OrderDate_Start: searchDto.orderDateStart ? toLogiwaDateFormat(toDateFromDateString(searchDto.orderDateStart)) : null,
      OrderDate_End: searchDto.orderDateEnd ? toLogiwaDateFormat(toDateFromDateString(searchDto.orderDateEnd)) : null,
      ChannelOrderCode: searchDto.channelOrderCode,
      CarrierTrackingNumber: searchDto.carrierTrackingNumber,
      ChannelID: searchDto.channelId ? [searchDto.channelId] : null,
      WarehouseOrderID: searchDto.warehouseOrderID,
      WarehouseOrderCode: searchDto.warehouseOrderCode,
    }
    return this.logiwaApiCall(`${this.logiwaApiConfig.apiBaseUrl}/ShipmentReportAllSearch`, body);
  }

  async getLogiwaInventoryItemCode(inventoryItemId: string): Promise<string> {
    const code: string = this.inventoryItemIdMap[inventoryItemId]?.code;
    if (code) {
      return code;
    }

    await this.updateInventoryItemMapJson(inventoryItemId);
    return this.inventoryItemIdMap[inventoryItemId]?.code;
  }

  async getLogiwaInventoryItemPackTypeId(inventoryItemId: string, logiwaItem: any): Promise<number> {
    const inventoryItemPackTypeId: number = this.inventoryItemIdMap[inventoryItemId]?.inventoryItemPackTypeId;
    if (inventoryItemPackTypeId) {
      return inventoryItemPackTypeId;
    }

    await this.updateInventoryItemMapJson(inventoryItemId, logiwaItem);
    return this.inventoryItemIdMap[inventoryItemId]?.inventoryItemPackTypeId;
  }

  async getLogiwaInventoryItemPackType(inventoryItemId: string, inventoryItemPackTypeId: string): Promise<any> {
    const inventoryItemPackType = this.inventoryItemIdMap[inventoryItemId]?.inventoryItemPackType;
    if (inventoryItemPackType?.Width) {
      return inventoryItemPackType;
    }

    await this.updateInventoryItemPackType(inventoryItemId, inventoryItemPackTypeId);
    return this.inventoryItemIdMap[inventoryItemId]?.inventoryItemPackType;
  }

  async getAllAvailableToPromiseReportList(): Promise<any> {
    this.logger.log(`Loading available report from logiwa`);

    const logiwaAvailableToPromiseReportSearchDto: LogiwaAvailableToPromiseReportSearchDto = { selectedPageIndex: 1 }

    let list = [];
    while (true) {
      const { Data: availableToPromiseReport } = await this.availableToPromiseReportSearch(logiwaAvailableToPromiseReportSearchDto);
      list = [...list, ...availableToPromiseReport ];

      if (logiwaAvailableToPromiseReportSearchDto.selectedPageIndex === availableToPromiseReport[0].PageCount) {
        this.logger.log('Complete to load available report');
        break;
      }

      logiwaAvailableToPromiseReportSearchDto.selectedPageIndex = logiwaAvailableToPromiseReportSearchDto.selectedPageIndex + 1;
    }

    return list;
  }

  async exportLogiwaInventoryItemsTSV(): Promise<Readable> {
    const headers: string[] = ['STD_SKU', 'ID'];
    const bodies: string[][] = [];
    
    const logiwaInventoryItemSearchDto = { selectedPageIndex: 1 };
    while (true) {
      const { Data: logiwaItems } = await this.inventoryItemSearch(logiwaInventoryItemSearchDto);
      
      logiwaItems.forEach((item: any) => bodies.push([item.Code.toUpperCase(), item.ID]));

      this.logger.log(
        `Page Done ${logiwaInventoryItemSearchDto.selectedPageIndex}/${logiwaItems[0].PageCount} with ${logiwaItems.length} inventory records`
      );
      
      if (logiwaInventoryItemSearchDto.selectedPageIndex === logiwaItems[0].PageCount) {
        break;
      }

      logiwaInventoryItemSearchDto.selectedPageIndex = logiwaInventoryItemSearchDto.selectedPageIndex + 1;
    }

    const tsvRows = [headers.join('\t'), ...bodies.map((body: string[]): string => body.join('\t'))];
    const buffer =  Buffer.from(tsvRows.join('\n'), 'utf8');
    return Readable.from(buffer);
  }

  async exportLogiwaChannelItemsTSV(channelId?: number): Promise<Readable> {
    const headers: string[] = ['ChannelID', 'ChannelDescription', 'StoreName', 'ID', 'InventoryItemID', 'ChannelItemNumber', 'SellerSKU'];
    const bodies: string[][] = [];
    const channelIds: number[] = getChannelIds();

    for (let i = 0; i < channelIds.length; i++) {
      if (channelId && channelIds[i] !== channelId) {
        continue;
      }

      const logiwaItemChannelListingSearchDto = { selectedPageIndex: 1, channelId: channelIds[i] };
      
      while (true) {
        const { Data: logiwaListings } = await this.inventoryItemItemChannelIDsSearch(logiwaItemChannelListingSearchDto);
        logiwaListings.forEach((item: any) => bodies.push([item.ChannelID, item.ChannelDescription, item.StoreName, item.ID, item.InventoryItemID, item.ChannelItemNumber, item.SellerSKU]));

        this.logger.log(
          `Load ${channelIds[i]} ${logiwaItemChannelListingSearchDto.selectedPageIndex}/${logiwaListings[0].PageCount} with ${logiwaListings.length} item records`
        );

        if (logiwaItemChannelListingSearchDto.selectedPageIndex === logiwaListings[0].PageCount) {
          break;
        }

        logiwaItemChannelListingSearchDto.selectedPageIndex = logiwaItemChannelListingSearchDto.selectedPageIndex + 1;
      }
    }

    const tsvRows = [headers.join('\t'), ...bodies.map((body: string[]): string => body.join('\t'))];
    const buffer =  Buffer.from(tsvRows.join('\n'), 'utf8');
    return Readable.from(buffer);
  }

  private async updateInventoryItemMapJson(inventoryItemId: string, logiwaItem?: any): Promise<void> {
    const { Data: [inventoryItem] } = logiwaItem ? { Data: [logiwaItem] } : await this.inventoryItemSearch({ id: Number(inventoryItemId) });
    if (inventoryItem) {
      const inventoryItemPackTypeId: number = await this.inventoryItemPackTypeSearch(inventoryItemId).then(({ Data: [inventoryItemPackType] }) => inventoryItemPackType.ID);
      const inventoryItemPackType: any = await this.inventoryItemPackTypeGet(`${inventoryItemPackTypeId}`);
      this.inventoryItemIdMap[inventoryItemId] = {
        inventoryItemPackTypeId,
        code: inventoryItem.Code,
        inventoryItemPackType
      };

      const writeStream = createWriteStream(this.logiwaApiConfig.inventoryItemMapFilename);
      writeStream.write(JSON.stringify(this.inventoryItemIdMap));
      writeStream.end();
    }
  }

  private async updateInventoryItemPackType(inventoryItemId: string, inventoryItemPackTypeId: string): Promise<void> {
    const inventoryItemPackType: any = await this.inventoryItemPackTypeGet(inventoryItemPackTypeId);
    this.inventoryItemIdMap[inventoryItemId].inventoryItemPackType = inventoryItemPackType;

    const writeStream = createWriteStream(this.logiwaApiConfig.inventoryItemMapFilename);
    writeStream.write(JSON.stringify(this.inventoryItemIdMap));
    writeStream.end();
  }
}

interface LogiwaApiConfig {
  username: string,
  password: string,
  baseUrl: string,
  apiBaseUrl: string,
  depositorId: number,
  warehouseId: number,
  numberOfApiCallPerSecond: number,
  inventoryItemMapFilename: string,
}