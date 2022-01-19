import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Method } from 'axios';
import { HmacSHA256, enc } from 'crypto-js';
import { getCurrentDate, toSearsDateFormat } from 'src/utils/dateTime.util';

@Injectable()
export class SearsApiService {
  private readonly logger = new Logger(SearsApiService.name);
  private searsApiconfig: SearsApiConfig;

  constructor(private readonly configService: ConfigService) {
    this.searsApiconfig = this.configService.get<SearsApiConfig>('searsApiConfig');
  }

  private buildQueryString(queryParams: { [key: string]: string }): string {
    return Object.keys(queryParams)
      .map((key: string): string => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
  }

  private getAuthorizationString(timeStamp: string): string {
    const signature: string = this.getSignature(timeStamp);
    return `HMAC-SHA256 emailaddress=${this.searsApiconfig.userId},timestamp=${timeStamp},signature=${signature}`;
  }

  private getSignature(timeStamp: string): string {
    const stringToSign = `${this.searsApiconfig.sellerId}:${this.searsApiconfig.userId}:${timeStamp}`;
    return HmacSHA256(stringToSign, this.searsApiconfig.authorizationKey).toString(enc.Hex);
  }

  private async searsApiCall({
    endpoint,
    method,
    headers = {},
    data,
    queryParams = {},
  }: SearsApiOptions): Promise<any> {
    const timeStamp: string = toSearsDateFormat(getCurrentDate());
    const queryString = this.buildQueryString(queryParams);
    try {
      const res = await axios({
        method,
        url: `${this.searsApiconfig.baseUrl}${endpoint}${queryString.length > 0 ? `?${queryString}` : ''}`,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          authorization: this.getAuthorizationString(timeStamp),
          ...headers,
        },
        data: data,
        validateStatus: (status: number): boolean => status >= 200 && status < 501,
      });

      return res.data;
    } catch (error) {
      this.logger.error('searsApiCall error');
      this.logger.error(error);

      throw error;
    }
  }

  async getShippingCarrier(): Promise<any> {
    return this.searsApiCall({
      endpoint: 'oms/shipping-carrier/v1',
      method: 'GET',
      queryParams: { sellerId: this.searsApiconfig.sellerId },
    });
  }
}

interface SearsApiConfig {
  userId: string;
  sellerId: string;
  authorizationKey: string;
  baseUrl: string;
}

interface SearsApiOptions {
  endpoint: string;
  method: Method;
  headers?: { [key: string]: string };
  data?: { [key: string]: any };
  queryParams: { [key: string]: string };
}
