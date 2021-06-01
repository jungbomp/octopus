import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Method } from 'axios';
import * as FormData from 'form-data';
import { Readable } from 'stream';
import { WalmartApiUpdateInventoryDto } from 'src/models/dto/wamartApiUpdateInventory.dto';
import { StoreType } from 'src/types';
import { guid } from '../utils/guid.util';

@Injectable()
export class WalmartApiService {
  private readonly logger = new Logger(WalmartApiService.name);

  private walmartApiConfig: WalmartApiConfig;

  private habToken: WalmartApiAccessTokenType;
  private maCroixToken: WalmartApiAccessTokenType;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.walmartApiConfig = this.configService.get<WalmartApiConfig>('walmartApiConfig');
    this.habToken = null;
    this.maCroixToken = null;
  }

  async getItems(store: StoreType, nextCursor?: string): Promise<any> {
    return await this.walmartApiCall(`items?limit=200${nextCursor ? `&nextCursor=${encodeURIComponent(nextCursor)}` : ''}`, 'get', {}, null, store);
  }

  async getInventory(store: StoreType, sku: string): Promise<any> {
    return await this.walmartApiCall(`inventory?sku=${encodeURIComponent(sku)}`, 'get', {}, null, store);
  }

  async getInventories(store: StoreType, limit?: number, nextCursor?: string): Promise<any> {
    return;
  }

  async updateInventory(store: StoreType, {sku, amount }: WalmartApiUpdateInventoryDto): Promise<any> {
    const data = {
      sku,
      quantity: {
        unit: 'EACH',
        amount
      }
    }

    return await this.walmartApiCall(`inventory?sku=${encodeURIComponent(sku)}`, 'put', {}, JSON.stringify(data), store);
  }

  async bulkItemInventoryUpdate(store: StoreType, walmartApiUpdateInventories: WalmartApiUpdateInventoryDto[]): Promise<any> {
    const inventory = walmartApiUpdateInventories.map((walmartApiUpdateInventory: WalmartApiUpdateInventoryDto): any => ({
      sku: walmartApiUpdateInventory.sku,
      quantity: {
        unit: 'EACH',
        amount: walmartApiUpdateInventory.amount
      }
    }));
    
    const requestJson = {
      InventoryHeader: {
        version: '1.4'
      },
      Inventory: inventory
    };

    const formData: FormData = new FormData();
    formData.append('file', JSON.stringify(requestJson), 'feeds.json');

    const headers = {
      ...formData.getHeaders()
    }

    return await this.walmartApiCall('feeds?feedType=inventory', 'post', headers, formData, store);
  }

  async getFeedStatus(store: StoreType, feedId?: string): Promise<any> {
    return await this.walmartApiCall(`feeds${feedId ? `?feedId=${encodeURIComponent(feedId)}` : ''}`, 'get', {}, null, store);
  }

  async getOrder(orderNumber: string, store: StoreType): Promise<any> {
    return await this.walmartApiCall(`orders/${orderNumber}`, 'get', {}, null, store);
  }

  async updateOrder(orderNumber: string, store: StoreType, trackingNumber: string): Promise<any> {
    const { order } = await this.getOrder(orderNumber, store);
    const shipDateTime = Date.now();

    const orderLine = order.orderLines.orderLine
      .filter((orderLine: any) => {
        const trackingInfo = orderLine.orderLineStatuses.orderLineStatus[0].trackingInfo;
        return (trackingInfo?.trackingNumber || '').length === 0 || trackingInfo.trackingNumber !== trackingNumber;
      })
      .map(orderLine => ({
        lineNumber: orderLine.lineNumber,
        orderLineStatuses: {
          orderLineStatus: [
            {
              status: "Shipped",
              statusQuantity: {
                unitOfMeasurement: "EACH",
                amount: "1"
              },
              trackingInfo: {
                shipDateTime,
                carrierName: {
                  otherCarrier: null,
                  carrier: "USPS"
                },
                methodCode: "Standard",
                trackingNumber
              }
            }
          ]
        }
      }));

    if (orderLine.length === 0) {
      return { order };
      // return order.orderLines.orderLine[0].orderLineStatuses.orderLineStatus[0].trackingInfo.shipDateTime
    }

    const data = {
      orderShipment: {
        orderLines: {
          orderLine
        }
      }
    }

    return await this.walmartApiCall(`orders/${orderNumber}/shipping`, 'post', {}, JSON.stringify(data), store);
  }

  async exportWalmarteItemsTSV(store: StoreType): Promise<Readable> {
    const headers: string[] = ['Store', 'SKU', 'wpid', 'upc', 'gtin', 'productName', 'productType', 'price', 'publishedStatus', 'lifecycleStatus'];
    const bodies: string[][] = [];
    
    const items = await this.getAllItemsWalmart(store);
    items.forEach(item => bodies.push([store, item.sku, item.wpid, item.upc, item.gtin, item.productName, item.priductType, item.price.amount, item.publishedStatus, item.lifecycleStatus]));

    const tsvRows = [headers.join('\t'), ...bodies.map((body: string[]): string => body.join('\t'))];
    const buffer =  Buffer.from(tsvRows.join('\n'), 'utf8');
    return Readable.from(buffer);
  }

  private async getAllItemsWalmart(store: StoreType): Promise<any[]> {
    this.logger.log('getAllItemsWalmart');
    let items = [];
    let response = { nextCursor: undefined, ItemResponse: [], totalItems: 0 };
    do {
      response = await this.getItems(store, response.nextCursor );
      items = [...items, ...response.ItemResponse];
      this.logger.log(`Retrieve walmart ${store} item ${items.length}/${response.totalItems}`);
    } while (response.nextCursor);

    return items;
  }

  private async walmartApiCall(url: string, method: Method, headers, data: any, store: StoreType, setAccessToken = true): Promise<any> {
    const clientToken: WalmartApiClientTokenType = store === StoreType.HAB ? this.walmartApiConfig.habClientToken : this.walmartApiConfig.maCroixClientToken;
    const { access_token } = setAccessToken ? await this.authorize(store) : { access_token: null };

    try {
      const res = await axios({
        method,
        url: `${this.walmartApiConfig.baseUrl}/${url}`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${clientToken.clientId}:${clientToken.clientSecret}`).toString('base64')}`,
          'WM_QOS.CORRELATION_ID': guid(),
          'WM_SVC.NAME': 'Walmart Service Name',
          ...headers,
          ...(access_token ? { 'WM_SEC.ACCESS_TOKEN': access_token } : {})
        },
        data: data
      });

      if (res.status !== 200) {
        this.logger.log('WalmartApiCall error');
        if (res.status === 520) {
          this.logger.log(res.data);
        }

        this.logger.log(res);
        throw new Error(res.statusText);
      }

      return res.data;
    } catch (error) {
      this.logger.log('WalmartApiCall error');
      this.logger.log(error);
      throw error;
    }
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   */
  private async authorize(store: StoreType): Promise<WalmartApiAccessTokenType> {
    if (store === StoreType.HAB && this.habToken && new Date(Date.now()) < this.habToken.expires) {
      return this.habToken;
    } else if (store === StoreType.MA && this.maCroixToken && new Date(Date.now()) < this.maCroixToken.expires) {
      return this.maCroixToken;
    }
  
    const formBody = [];
    formBody.push(`${encodeURIComponent('grant_type')}=${encodeURIComponent('client_credentials')}`);
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    
    const token = await this.walmartApiCall('token', 'post', headers, formBody.join('&'), store, false);
    const walmartApiToken: WalmartApiAccessTokenType = {
      ...token,
      expires: new Date(Date.now() + ((token.expires_in - 5) * 1000))
    }

    if (store === StoreType.HAB) {
      this.habToken = walmartApiToken;
    } else {
      this.maCroixToken = walmartApiToken;
    }
    
    return walmartApiToken;
  }
}

interface WalmartApiClientTokenType {
  clientId: string,
  clientSecret: string
}

interface WalmartApiConfig {
  username: string,
  password: string,
  baseUrl: string,
  habClientToken: WalmartApiClientTokenType,
  maCroixClientToken: WalmartApiClientTokenType
}

interface WalmartApiAccessTokenType {
  access_token: string,
  token_type: string,
  expires: Date
}
