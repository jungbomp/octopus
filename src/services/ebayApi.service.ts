import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Method } from 'axios';
import * as FormData from 'form-data';
import { Readable } from 'stream';
import { EbayApiBulkUpdatePriceQuantityDto } from 'src/models/dto/ebayApiBulkUpdatePriceQuantity.dto';
import { EbayApiCreateShippingFulfillmentDto } from 'src/models/dto/ebayApiCreateShippingFulfillment.dto';
import { EbayApiCreateTaskDto } from 'src/models/dto/ebayApiCreateTask.dto';
import { EbayApiGetOrdersDto } from 'src/models/dto/ebayApiGetOrders.dto';

import { EbayApiGetResultFileDto } from 'src/models/dto/ebayApiGetResultFile.dto';
import { EbayApiFileUploadDto } from 'src/models/dto/ebayApiFileUpload.dto';
import { EbayApiGetTaskDto } from 'src/models/dto/ebayApiGetTask.dto';
import { EbayApiGetTasksDto } from 'src/models/dto/ebayApiGetTasks.dto';
import { StoreType } from 'src/types';
import { toDateFromDateString, toDateFromISOString } from '../utils/dateTime.util';

@Injectable()
export class EbayApiService {
  private readonly logger = new Logger(EbayApiService.name);
  private readonly maxLimit = 100;
  private readonly minLimit = 10;
  private readonly minOffset = 0;

  private ebayApiConfig: EbayApiConfig;
  private habToken: EbayApiAccessTokenType;
  private maCroixToken: EbayApiAccessTokenType;

  private scope: string[] = [
    'https://api.ebay.com/oauth/api_scope/sell.marketing',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
    'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.finances',
    'https://api.ebay.com/oauth/api_scope/sell.payment.dispute',
    'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
  ];

  constructor(private readonly configService: ConfigService) {
    this.ebayApiConfig = this.configService.get<EbayApiConfig>('ebayApiConfig');
  }

  async getInventoryItem(store: StoreType, sku: string): Promise<any> {
    return await this.ebayApiCall(`sell/inventory/v1/inventory_item/${sku}?`, 'get', {}, null, store);
  }

  async getInventoryItems(store: StoreType, limit = this.minLimit, offset = this.minOffset): Promise<any> {
    const params = [
      `${'limit'}=${encodeURIComponent(Math.max(this.minLimit, Math.min(this.maxLimit, limit)))}`,
      `${'offset'}=${encodeURIComponent(Math.max(this.minOffset, offset))}`,
    ];

    return await this.ebayApiCall(`sell/inventory/v1/inventory_item?${params.join('&')}`, 'get', {}, null, store);
  }

  async bulkMigrateListing(store: StoreType, listingIds: string[]): Promise<any> {
    const data = {
      requests: listingIds.map((listingId: string) => ({ listingId })),
    };

    return await this.ebayApiCall(`sell/inventory/v1/bulk_migrate_listing`, 'post', {}, data, store);
  }

  async migrate(store: StoreType, listingIds: string[]): Promise<any> {
    while (listingIds.length > 0) {
      const listingId = listingIds.shift();
      this.logger.log(`${store}: ${listingId}`);

      try {
        this.logger.log(await this.bulkMigrateListing(store, [listingId]));
      } catch (error) {
        this.logger.log(`${store} error!`);
      }
    }

    return;
  }

  async bulkUpdatePriceQuantity(
    store: StoreType,
    bulkUpdatePriceQuantityDtos: EbayApiBulkUpdatePriceQuantityDto[],
  ): Promise<number> {
    const updatePriceQuantityDtos: EbayApiBulkUpdatePriceQuantityDto[] = [...bulkUpdatePriceQuantityDtos];

    let processed = 0;
    while (updatePriceQuantityDtos.length > 0) {
      const dto: EbayApiBulkUpdatePriceQuantityDto = updatePriceQuantityDtos.shift();
      const data = {
        requests: [dto].map((bulkUpdatePriceQuantity) => ({
          shipToLocationAvailability: {
            quantity: bulkUpdatePriceQuantity.quantity,
          },
          sku: bulkUpdatePriceQuantity.sku,
        })),
      };

      try {
        await this.ebayApiCall('sell/inventory/v1/bulk_update_price_quantity', 'post', {}, data, store);
        processed++;
      } catch (error) {
        this.logger.error(`Catched bulkUpdatePriceQuantity - ${dto.sku}`);
        this.logger.error(error);
      }
    }

    return processed;
  }

  async getOrders(
    store: StoreType,
    {
      limit,
      offset,
      creationDateFrom: creationFrom,
      creationDateTo: creationTo,
      lastModifiedDateFrom: lastModifiedFrom,
      lastModifiedDateTo: lastModifiedTo,
    }: EbayApiGetOrdersDto,
  ): Promise<any> {
    const creationDateFrom: Date =
      creationFrom &&
      (creationFrom?.lastIndexOf('Z') > -1 ? toDateFromISOString(creationFrom) : toDateFromDateString(creationFrom));
    const creationDateTo: Date =
      creationTo &&
      (creationTo?.lastIndexOf('Z') > -1 ? toDateFromISOString(creationTo) : toDateFromDateString(creationTo));
    const lastModifiedDateFrom: Date =
      lastModifiedFrom &&
      (lastModifiedFrom?.lastIndexOf('Z') > -1
        ? toDateFromISOString(lastModifiedFrom)
        : toDateFromDateString(lastModifiedFrom));
    const lastModifiedDateTo: Date =
      lastModifiedTo &&
      (lastModifiedTo?.lastIndexOf('Z') > -1
        ? toDateFromISOString(lastModifiedTo)
        : toDateFromDateString(lastModifiedTo));

    const params = [
      `${'limit'}=${encodeURIComponent(Math.max(10, Math.min(200, limit ?? 200)))}`,
      `${'offset'}=${encodeURIComponent(Math.max(0, offset ?? 0))}`,
    ];

    const filter: string[] = [];
    if (creationDateFrom) {
      filter.push(`creationdate:[${creationDateFrom.toISOString()}..${creationDateTo?.toISOString() ?? ''}]`);
    }

    if (lastModifiedDateFrom) {
      filter.push(
        `lastmodifieddate:[${lastModifiedDateFrom.toISOString()}..${lastModifiedDateTo?.toISOString() ?? ''}]`,
      );
    }

    if (filter.length > 0) {
      params.push(`filter=${encodeURIComponent(filter.join(','))}`);
    }

    return await this.ebayApiCall(`sell/fulfillment/v1/order?${params.join('&')}`, 'get', {}, null, store);
  }

  async getOrder(store: StoreType, orderId: string): Promise<any> {
    return await this.ebayApiCall(`sell/fulfillment/v1/order/${orderId}`, 'get', {}, null, store);
  }

  async getShippingFulfillments(store: StoreType, orderId: string): Promise<any> {
    return await this.ebayApiCall(
      `sell/fulfillment/v1/order/${encodeURIComponent(orderId)}/shipping_fulfillment`,
      `get`,
      {},
      null,
      store,
    );
  }

  async createShippingFulfillment(
    store: StoreType,
    {
      orderId,
      lineItems,
      trackingNumber,
      shippingCarrierCode,
      shippedDate: shippedDateStr,
    }: EbayApiCreateShippingFulfillmentDto,
  ): Promise<any> {
    const shippedDate: string =
      shippedDateStr &&
      (shippedDateStr.lastIndexOf('Z') > 0 ? shippedDateStr : toDateFromDateString(shippedDateStr).toISOString());
    const data = {
      lineItems,
      trackingNumber,
      shippingCarrierCode,
      ...(shippedDate ? { shippedDate } : {}),
    };

    return await this.ebayApiCall(
      `sell/fulfillment/v1/order/${encodeURIComponent(orderId)}/shipping_fulfillment`,
      'post',
      {},
      JSON.stringify(data),
      store,
    );
  }

  async exportAllInventoryItems(store: StoreType): Promise<Readable> {
    const items = await this.getAllInventoryItems(store);

    const tsvRow: string[] = [];
    tsvRow.push('Store\tSKU\tupc\tproductName\tcondition\tquantity');
    items.forEach((item) => {
      tsvRow.push(
        `${store}\t${item.sku}\t${item.product?.upc}\t${item.product?.title}\t${item.condition}\t${item.availability?.shipToLocationAvailability?.quantity}`,
      );
    });

    const buffer = Buffer.from(tsvRow.join('\n'), 'utf8');
    return Readable.from(buffer);
  }

  private async getAllInventoryItems(store: StoreType): Promise<any[]> {
    this.logger.log('getAllInventoryItems');

    let items = [];
    let offset = 0;
    while (true) {
      const res = await this.getInventoryItems(store, this.maxLimit, offset);
      if (res.inventoryItems && res.inventoryItems.length > 0) {
        items = [...items, ...res.inventoryItems];
      }

      this.logger.log(`Retrieve ebay ${store} inventory items ${items.length}/${res.total}`);

      if (!res.next) {
        break;
      }

      offset += res.size;
    }

    return items;
  }

  /**
   * https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/createTask
   */
  private async createInventoryTask({ store, feedType, schemaVersion }: EbayApiCreateTaskDto): Promise<any> {
    const data = { feedType, schemaVersion };

    return await this.ebayApiCall('sell/feed/v1/task/', 'post', {}, JSON.stringify(data), store);
  }

  private async uploadFile({ store, taskId }: EbayApiFileUploadDto): Promise<any> {
    const requestJson = {};

    const formData: FormData = new FormData();
    formData.append('fileName', JSON.stringify(requestJson), 'feeds.json');
    formData.append('name', 'file');
    formData.append('type', 'form-data');

    const headers = {
      ...formData.getHeaders(),
    };

    return await this.ebayApiCall(`sell/feed/v1/task/${taskId}/upload_file`, 'post', headers, formData, store);
  }

  private async getTasks({
    store,
    feedType,
    lookBackDays,
    dateRange,
    limit,
    offset,
  }: EbayApiGetTasksDto): Promise<any[]> {
    const queryParams: string[] = [];
    if (feedType) {
      queryParams.push(`feed_type=${encodeURIComponent(feedType)}`);
    }

    if (lookBackDays) {
      queryParams.push(`look_back_days=${lookBackDays}`);
    }

    if (dateRange) {
      queryParams.push(`date_range=${encodeURIComponent(dateRange)}`);
    }

    if (limit) {
      queryParams.push(`limit=${limit}`);
    }

    if (offset) {
      queryParams.push(`offset=${offset}`);
    }

    return await this.ebayApiCall(
      `sell/feed/v1/task${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`,
      'get',
      {},
      null,
      store,
    );
  }

  private async getTask({ store, taskId }: EbayApiGetTaskDto): Promise<any> {
    return await this.ebayApiCall(`sell/feed/v1/task/${taskId}`, 'get', {}, null, store);
  }

  private async getResultFile({ store, taskId }: EbayApiGetResultFileDto): Promise<any> {
    return await this.ebayApiCall(`sell/feed/v1/task/${taskId}/download_result_file`, 'get', {}, null, store);
  }

  private async getUserConsent(): Promise<string> {
    const responseType = 'code';
    const prompt = 'login';

    const params: string[] = [
      `client_id=${encodeURIComponent(this.ebayApiConfig.appId)}`,
      `redirect_uri=${encodeURIComponent(this.ebayApiConfig.redirectUri)}`,
      `response_type=${encodeURIComponent(responseType)}`,
      `scope=${encodeURIComponent(this.scope.join(' '))}`,
      `prompt=${encodeURIComponent(prompt)}`,
    ];

    const ret = await axios({
      method: 'get',
      url: `${this.ebayApiConfig.authUrl}?${params.join('&')}`,
    });

    return ret.data;
  }

  private async generateAuthToken(code: string): Promise<EbayApiAccessTokenType> {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${this.ebayApiConfig.appId}:${this.ebayApiConfig.certId}`).toString(
        'base64',
      )}`,
    };

    const formBody = [
      `${encodeURIComponent('grant_type')}=${encodeURIComponent('authorization_code')}`,
      `${encodeURIComponent('code')}=${encodeURIComponent(code)}`,
      `${encodeURIComponent('redirect_uri')}=${encodeURIComponent(this.ebayApiConfig.redirectUri)}`,
    ];

    const token: any = await this.ebayApiCall(
      'identity/v1/oauth2/token',
      'post',
      headers,
      formBody.join('&'),
      null,
      false,
    );

    return {
      ...token,
      expires_in: new Date(Date.now() + (token.expires_in - 5) * 1000),
      refresh_token_expires_in: new Date(Date.now() + (token.refresh_token_expires_in - 5) * 1000),
    };
  }

  private async refreshAuthToken(refreshToken: string): Promise<EbayApiAccessTokenType> {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${this.ebayApiConfig.appId}:${this.ebayApiConfig.certId}`).toString(
        'base64',
      )}`,
    };

    const formBody = [
      `${encodeURIComponent('grant_type')}=${encodeURIComponent('refresh_token')}`,
      `${encodeURIComponent('refresh_token')}=${encodeURIComponent(refreshToken)}`,
      `${encodeURIComponent('scope')}=${encodeURIComponent(this.scope.join(' '))}`,
    ];

    const token: any = await this.ebayApiCall(
      'identity/v1/oauth2/token',
      'post',
      headers,
      formBody.join('&'),
      null,
      false,
    );

    return {
      ...token,
      expires_in: new Date(Date.now() + (token.expires_in - 5) * 1000),
    };
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * Get new refesh token by following below link when the token is expired
   * https://developer.ebay.com/api-docs/static/oauth-authorization-code-grant.html
   */
  private async authorize(store: StoreType): Promise<EbayApiAccessTokenType> {
    if (store === StoreType.HAB) {
      if (this.habToken && new Date(Date.now()) < this.habToken.expires_in) {
        return this.habToken;
      }

      if (new Date(Date.now()) < new Date(this.ebayApiConfig.habRefreshTokenExpires)) {
        this.habToken = await this.refreshAuthToken(this.ebayApiConfig.habRefreshToken);
      } else {
        // this.habToken = await this.generateAuthToken();
      }

      return this.habToken;
    } else {
      if (this.maCroixToken && new Date(Date.now()) < this.maCroixToken.expires_in) {
        return this.maCroixToken;
      }

      if (new Date(Date.now()) < new Date(this.ebayApiConfig.maRefreshTokenExpires)) {
        this.maCroixToken = await this.refreshAuthToken(this.ebayApiConfig.maRefreshToken);
      } else {
        // this.maCroixToken = await this.generateAuthToken();
      }

      return this.maCroixToken;
    }
  }

  private async ebayApiCall(
    url: string,
    method: Method,
    headers: any,
    data: any,
    store: StoreType,
    setAccessToken = true,
  ): Promise<any> {
    const { access_token } = setAccessToken ? await this.authorize(store) : { access_token: null };

    const res = await axios({
      method,
      url: `${this.ebayApiConfig.baseUrl}/${url}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
        ...headers,
      },
      data: data,
    });

    if (Math.floor(res.status / 10) !== 20) {
      throw new Error(res.statusText);
    }

    return res.data;
  }
}

interface EbayApiConfig {
  baseUrl: string;
  authUrl: string;
  appId: string;
  devId: string;
  certId: string;
  redirectUri: string;
  habRefreshToken: string;
  habRefreshTokenExpires: string;
  maRefreshToken: string;
  maRefreshTokenExpires: string;
}

interface EbayApiAccessTokenType {
  access_token: string;
  expires_in: Date;
  token_type: string;
}
