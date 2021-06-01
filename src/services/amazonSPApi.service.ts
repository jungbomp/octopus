import {  Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Method } from 'axios';
import { inspect } from 'util';
import { EbayApiBulkUpdatePriceQuantityDto } from 'src/models/dto/ebayApiBulkUpdatePriceQuantity.dto';
import { EbayApiCreateShippingFulfillmentDto } from 'src/models/dto/ebayApiCreateShippingFulfillment.dto';
import { EbayApiCreateTaskDto } from 'src/models/dto/ebayApiCreateTask.dto';
import { EbayApiGetOrdersDto } from 'src/models/dto/ebayApiGetOrders.dto';
import { StoreType } from 'src/types';
import { getCurrentDate,  toAmazonDateFormat, toDateFromDateString } from '../utils/dateTime.util';

import { HmacSHA256, SHA256, lib, enc } from 'crypto-js';
import { AmazonSPSpiOrdersRequest } from 'src/models/amazonSPApiOrdersRequest';


@Injectable()
export class AmazonSPApiService {

  private readonly logger = new Logger(AmazonSPApiService.name);
  private readonly awsTermination = 'aws4_request';
  private readonly algorithm = 'AWS4-HMAC-SHA256';
  private readonly apiService = 'execute-api';
  private readonly stsService = 'sts';
  private readonly marketPlaceId = 'ATVPDKIKX0DER';

  private amazonSPApiConfig: AmazonSPApiConfig;
  private awsIamConfig: AwsIamConfig;
  private habToken: AmazonSPApiAccessTokenType;
  private maCroixToken: AmazonSPApiAccessTokenType;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.amazonSPApiConfig = this.configService.get<AmazonSPApiConfig>('amazonSPApiConfig');
    this.awsIamConfig = this.configService.get<AwsIamConfig>('awsIamConfig');
  }

  async getOrders(store: StoreType, ordersRequest: AmazonSPSpiOrdersRequest): Promise<any> {
    const queryParam = new Map<string, string>();
    queryParam.set('MarketplaceIds', this.marketPlaceId);
    if (ordersRequest.createdAfter) {
      const createdAfter: string = toDateFromDateString(ordersRequest.createdAfter).toISOString();
      queryParam.set('CreatedAfter', createdAfter);
    }

    if (ordersRequest.createdBefore) {
      const createdBefore: string = toDateFromDateString(ordersRequest.createdBefore).toISOString();
      queryParam.set('CreatedBefore', createdBefore);
    }

    if (ordersRequest.lastUpdatedAfter) {
      const lastUpdatedAfter: string = toDateFromDateString(ordersRequest.lastUpdatedAfter).toISOString();
      queryParam.set('LastUpdatedAfter', lastUpdatedAfter);
    }

    if (ordersRequest.lastUpdatedBefore) {
      const lastUpdatedBefore: string = toDateFromDateString(ordersRequest.lastUpdatedBefore).toISOString();
      queryParam.set('LastUpdatedBefore', lastUpdatedBefore);
    }

    if (ordersRequest.orderStatus) {
      queryParam.set('OrderStatus', ordersRequest.orderStatus);
    }

    if (ordersRequest.nextToken) {
      queryParam.set('NextToken', ordersRequest.nextToken);
    }

    return this.amazonSPApiCall('/orders/v0/orders', 'GET', {}, null, queryParam, store);
  }

  async getOrder(store: StoreType, orderId: string): Promise<any> {
    const queryParam = new Map<string, string>();
    queryParam.set('MarketplaceIds', this.marketPlaceId);
    return this.amazonSPApiCall(`/orders/v0/orders/${orderId}`, 'GET', {}, null, queryParam, store);
  }

  async getShipments(store: StoreType, shipmentId: string): Promise<any> {
    return;
  }

  private getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): lib.WordArray {
    const kDate = HmacSHA256(dateStamp, 'AWS4' + key);
    const kRegion = HmacSHA256(regionName, kDate);
    const kService = HmacSHA256(serviceName, kRegion);
    const kSigning = HmacSHA256(this.awsTermination, kService);
    return kSigning;
  }

  private getCredentialScope(dateStamp: string, service: string): string {
    const awsRegion = this.awsIamConfig.awsRegion;
    const terminationString = this.awsTermination;

    return [
      dateStamp,
      awsRegion,
      service,
      terminationString
    ].join('/');
  }

  private getCredentialString(accessKey: string, dateStamp: string, service: string): string {
    return [
      accessKey,
      this.getCredentialScope(dateStamp, service)
    ].join('/');
  }

  private getQueryString(queryParams: Map<string, string>): string {
    const keys = [...queryParams.keys()].sort();
    return keys.map((key: string) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams.get(key))}`).join('&');
  }

  private signedHeaders(): string[] {
    // return [ 'host', 'user-agent', 'x-amz-access-token', 'x-amz-date' ];
    return [ 'host', 'x-amz-access-token', 'x-amz-date' ];
  }

  private getUserAgent(): string {
    return `HAB_Octopus/Beta (Languate=javascript; platform=ubuntu)`;
  }

  private getCanonicalHeader(accessToken: string, amzDate: string): CanonicalHeader {
    return {
      host: this.amazonSPApiConfig.baseUrl,
      // 'user-agent': this.getUserAgent(),
      'x-amz-access-token': accessToken,
      'x-amz-date': amzDate,
    };
  }

  private getCanonicalHeaderString(canonicalHeader: CanonicalHeader): string {
    return this.signedHeaders()
      .map((signedHeader: string): string => `${signedHeader}:${canonicalHeader[signedHeader]}`)
      .join('\n') + '\n';
  }

  private getCanonicalRequest(method: string, canonicalUri: string, query: string, canonicalHeaders: CanonicalHeader, payload: any): string {
    const payloadString: string = payload ? JSON.stringify(payload) : '';

    const canonicalRequests: string[] = [
      method,
      canonicalUri,
      query ?? '',
      this.getCanonicalHeaderString(canonicalHeaders),
      this.signedHeaders().join(';'),
      SHA256(payloadString).toString()
    ];

    return canonicalRequests.join('\n');
  }

  private roleCredentialsSignedHeaders(): string[] {
    return ['host', 'x-amz-content-sha256', 'x-amz-date'];
  }

  private getRoleCredentialsCanonicalHeader(query: string, amzDate: string): RoleCredentialsCanonicalHeader {
    return {
      host: this.awsIamConfig.stsUrl,
      ['x-amz-content-sha256']: SHA256(query).toString(enc.Hex),
      ['x-amz-date']: amzDate
    };
  }

  private getRoleCredentialsCanonicalHeaderString(roleCredentialsCanonicalHeader: RoleCredentialsCanonicalHeader): string {
    return this.roleCredentialsSignedHeaders()
      .map((signedHeader: string): string => `${signedHeader}:${roleCredentialsCanonicalHeader[signedHeader]}`)
      .join('\n') + '\n';
  }

  private getRoleCredentialsCanonicalRequest(query: string, roleCredentialsCanonicalHeader: RoleCredentialsCanonicalHeader): string {
    return [
      'POST',
      '/',
      '',
      this.getRoleCredentialsCanonicalHeaderString(roleCredentialsCanonicalHeader),
      this.roleCredentialsSignedHeaders().join(';'),
      SHA256(query).toString()
    ].join('\n');
  }

  private getAuthorizationString(accessKey: string, signature: string, dateStamp: string, service: string, signedHeaders: string[]): string {
    return `${this.algorithm} Credential=${this.getCredentialString(accessKey, dateStamp, service)}, SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`;
  }

  private getCanonicalStringForSign(canonicalRequest: string, requestDate: string, service: string): string {
    const dateStamp = requestDate.substring(0, 8);
    const hashedCanonicalRequest = SHA256(canonicalRequest).toString();

    return [
      this.algorithm,
      requestDate,
      this.getCredentialScope(dateStamp, service),
      hashedCanonicalRequest
    ].join('\n');
  }

  private signCanonicalRequest(secretAccessKey: string, canonicalRequest: string, requestDate: string, service: string): string {
    const dateStamp = requestDate.substring(0, 8);
    const message = this.getCanonicalStringForSign(canonicalRequest, requestDate, service);
    const key = this.getSignatureKey(secretAccessKey, dateStamp, this.awsIamConfig.awsRegion, service);

    return HmacSHA256(message, key).toString(enc.Hex);
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * Get new refesh token by following below link when the token is expired
   * https://developer.ebay.com/api-docs/static/oauth-authorization-code-grant.html
   */
   private async authorize(store: StoreType): Promise<AmazonSPApiAccessTokenType> {
    
    if (store === StoreType.HAB && this.habToken && new Date(Date.now()) < this.habToken.expires) {
      return this.habToken;
    } else if (this.maCroixToken && new Date(Date.now()) < this.maCroixToken.expires) {
      return this.maCroixToken;
    }

    const clientToken: AmazonSPApiClientTokenType = store === StoreType.HAB ? this.amazonSPApiConfig.habClientToken : this.amazonSPApiConfig.maCroixClientToken;
    
    const formBody = [];
    formBody.push(`${encodeURIComponent('grant_type')}=${encodeURIComponent('refresh_token')}`);
    formBody.push(`${encodeURIComponent('refresh_token')}=${encodeURIComponent(clientToken.refreshToken)}`);
    formBody.push(`${encodeURIComponent('client_id')}=${encodeURIComponent(clientToken.clientId)}`);
    formBody.push(`${encodeURIComponent('client_secret')}=${encodeURIComponent(clientToken.clientSecret)}`);

    const res = await axios({
      method: 'post',
      url: this.amazonSPApiConfig.authUrl,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formBody.join('&'),
    });
  
    if (Math.floor(res.status / 10) !== 20) {
      throw new Error(res.statusText);
    }

    const amzaonSPApiToken: AmazonSPApiAccessTokenType = {
      ...res.data,
      expires: new Date(Date.now() + ((res.data.expires_in - 5) * 1000))
    }

    if (store === StoreType.HAB) {
      this.habToken = amzaonSPApiToken;
    } else {
      this.maCroixToken = amzaonSPApiToken;
    }
    
    return amzaonSPApiToken;
  }

  private roleCredentialsRequestQuery(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('Action', 'AssumeRole');
    map.set('DurationSeconds', '3600');
    map.set('RoleArn', this.awsIamConfig.roleArn);
    map.set('RoleSessionName', 'SPAPISession');
    map.set('Version', '2011-06-15');

    return map;
  }

  private async signRoleCredentials(): Promise<any> {
    const requestDate: string = toAmazonDateFormat(getCurrentDate());
    const service: string = this.stsService;

    const query: string = this.getQueryString(this.roleCredentialsRequestQuery());
    const roleCredentialsCanonicalHeader: RoleCredentialsCanonicalHeader = this.getRoleCredentialsCanonicalHeader(query, requestDate);
    const roleCredentialsCanonicalRequest: string = this.getRoleCredentialsCanonicalRequest(query, roleCredentialsCanonicalHeader);
    const signature: string = this.signCanonicalRequest(this.awsIamConfig.secretAccessKey, roleCredentialsCanonicalRequest, requestDate, service);

    try {
      const res = await axios({
        method: 'POST',
        url: `https://${this.awsIamConfig.stsUrl}`,
        headers: {
          'Authorization': this.getAuthorizationString(this.awsIamConfig.accessKey, signature, requestDate.substring(0, 8), service, this.roleCredentialsSignedHeaders()),
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          ...roleCredentialsCanonicalHeader
        },
        data: query,
        validateStatus: (status: number): boolean => status >= 200 && status < 501,
      });

      return res.data;
    } catch(error) {
      this.logger.error('signRoleCredentialRequest error');
      this.logger.error(error);
    }
  }

  private async amazonSPApiCall(url: string, method: Method, headers: any, data: any, queryParams: Map<string, string>, store: StoreType): Promise<any> {
    const { access_token: accessToken } = await this.authorize(store);

    const { AssumeRoleResponse: { AssumeRoleResult: assumeRole }}: { AssumeRoleResponse : { AssumeRoleResult: AssumeRoleType }}  = await this.signRoleCredentials();
    
    
    const requestDate: string = toAmazonDateFormat(getCurrentDate());
    const service: string = this.apiService;

    const canonicalHeader: CanonicalHeader = this.getCanonicalHeader(accessToken, requestDate);
    const queryString: string = (queryParams && queryParams.size > 0 ? this.getQueryString(queryParams) : undefined);
    const canonicalRequest: string = this.getCanonicalRequest(method, url, queryString, canonicalHeader, data);
    const signature: string = this.signCanonicalRequest(assumeRole.Credentials.SecretAccessKey, canonicalRequest, requestDate, service);
    
    try {
      const res = await axios({
        method,
        url: `https://${this.amazonSPApiConfig.baseUrl}${url}${queryString ? `?${queryString}` : ''}`,
        headers: {
          'Authorization': this.getAuthorizationString(assumeRole.Credentials.AccessKeyId, signature, requestDate.substring(0, 8), service, this.signedHeaders()),
          'Content-Type': 'application/json; charset=utf-8',
          'x-amz-security-token': assumeRole.Credentials.SessionToken,
          ...canonicalHeader,
          ...headers,
        },
        data: data,
        validateStatus: (status: number): boolean => status >= 200 && status < 501,
      });

      return res.data;
    } catch (error) {
      this.logger.error('amazonSPApiCall error');
      this.logger.error(error);
      
      throw error;
    }
  }
}

interface AmazonSPApiClientTokenType {
  refreshToken: string,
  clientId: string,
  clientSecret: string
}

interface AmazonSPApiConfig {
  authUrl: string,
  baseUrl: string,
  habClientToken: AmazonSPApiClientTokenType,
  maCroixClientToken: AmazonSPApiClientTokenType,
}

interface AmazonSPApiAccessTokenType {
  access_token: string,
  refresh_token: string,
  token_type: string,
  expires_in: number,
  expires: Date,
}

interface AwsIamConfig {
  userName: string,
  accessKey: string,
  secretAccessKey: string,
  roleArn: string,
  consoleLoginLink: string,
  awsRegion: string,
  stsUrl: string,

}

interface CanonicalHeader {
  host: string,
  // ['user-agent']: string,
  ['x-amz-access-token']: string,
  ['x-amz-date']: string,
}

interface RoleCredentialsCanonicalHeader {
  host: string;
  ['x-amz-content-sha256']: string;
  ['x-amz-date']: string,
}

interface AssumRoleCredentials {
  AccessKeyId: string;
  Expiration: number;
  SecretAccessKey: string;
  SessionToken: string;
};

interface AssumeedRoleUser {
  Arn: string;
  AssumedRoleId: string;
}

interface AssumeRoleType {
  AssumedRoleUser: AssumeedRoleUser;
  Credentials: AssumRoleCredentials;
}
