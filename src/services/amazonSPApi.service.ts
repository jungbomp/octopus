import {  Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Method } from 'axios';

import { createCipheriv, createDecipheriv, Cipher } from 'crypto';
import { HmacSHA256, SHA256, lib, enc } from 'crypto-js';
import { gunzip } from 'zlib';
import { AmazonSPApiOrdersRequest } from 'src/models/amazonSP/amazonSPApiOrdersRequest';
import { AmazonSPApiFeedsRequest } from 'src/models/amazonSP/amazonSPApiGetFeedsRequest';
import { AmazonSPApiCreateFeedSpecification } from 'src/models/amazonSP/amazonSPApiCreateFeedSpecification';
import { AmazonSPApiCreateFeedDocumentSpecification } from 'src/models/amazonSP/amazonSPApiCreateFeedDocumentSpecification';
import { AmazonSPApiGetFeedDocumentResponse } from 'src/models/amazonSP/amazonSPApiGetFeedDocumentResponse';
import { AmazonSPApiCreateFeedDocumentResponse } from 'src/models/amazonSP/amazonSPApiCreateFeedDocumentResponse';
import { AmazonSPApiError } from 'src/models/amazonSP/amazonSPApiError';
import { AmazonSPApiGetFeedResponse } from 'src/models/amazonSP/amazonSPApiGetFeedResponse';
import { AmazonSPApiCreateFeedResponse } from 'src/models/amazonSP/amazonSPApiCreateFeedResponse';
import { AmazonSPApiGetFeedsResponse } from 'src/models/amazonSP/amazonSPApiGetFeedsResponse';
import { AmazonSPApiFeedDocument } from 'src/models/amazonSP/amazonSPApiFeedDocument';
import { AmazonSPApiListingsFeed } from 'src/models/amazonSP/amazonSPApiListingsFeed';
import { AmazonSPApiUpdateListingsItemQuantityRequest } from 'src/models/amazonSP/amazonSPApiUpdateListingsItemQuantityRequest';

import {
  AmazonSPFeedDocumentCompressionAlgorithm,
  AmazonSPFeedDocumentContentTypes,
  AmazonSPFeedProcessingStatusTypes,
  AmazonSPFeedTypes,
  AmazonSPListingsFeedOperationTypes,
  AmazonSPPatchOperations,
  StoreType
} from 'src/types';

import { getCurrentDate,  toAmazonDateFormat, toDateFromDateString } from '../utils/dateTime.util';
import { AmazonSPApiListingsFeedMessage } from 'src/models/amazonSP/amazonSPApiListingsFeedMessage';

@Injectable()
export class AmazonSPApiService {

  private readonly logger = new Logger(AmazonSPApiService.name);
  private readonly awsTermination = 'aws4_request';
  private readonly algorithm = 'AWS4-HMAC-SHA256';
  private readonly apiService = 'execute-api';
  private readonly stsService = 'sts';
  private readonly marketPlaceId = 'ATVPDKIKX0DER';
  private readonly feedVersion = '2020-09-04';

  private amazonSPApiConfig: AmazonSPApiConfig;
  private awsIamConfig: AwsIamConfig;
  private habToken: AmazonSPApiAccessTokenType;
  private maCroixToken: AmazonSPApiAccessTokenType;
  private arnAssumeRole: AssumeRoleType; 

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.amazonSPApiConfig = this.configService.get<AmazonSPApiConfig>('amazonSPApiConfig');
    this.awsIamConfig = this.configService.get<AwsIamConfig>('awsIamConfig');
  }

  async getMarketplaceParticipations(store: StoreType): Promise<any> {
    return this.amazonSPApiCall('/sellers/v1/marketplaceParticipations', 'GET', {}, null, null, store);
  }

  async putListingsItem(store: StoreType, sku: string): Promise<any> {
    const queryParam = new Map<string, string>();
    queryParam.set('marketplaceIds', this.marketPlaceId);
    queryParam.set('issueLocale', 'en_US');

    const body = {
      productType: 'PRODUCT',
      patches: [
        {
          op: 'replace',
          path: '/attributes/fulfillment_availability',
          value: [
            {
              fulfillment_channel_code: 'AMAZON_NA',
              is_inventory_available: true,
              quantity: 30
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/supplier_declared_dg_hz_regulation',
          value: [
            {
              value: 'not_applicable'
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/batteries_required',
          value: [
            {
              value: false
            }
          ]
        }
      ]
    }

    this.logger.log('putListingsItem');

    return this.amazonSPApiCall(`/listings/2020-09-01/items/A2GY2PNPNA7TY6/${sku}`, 'PATCH', {}, body, queryParam, store);
  }

  async getOrders(store: StoreType, ordersRequest: AmazonSPApiOrdersRequest): Promise<any> {
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

  async getFeeds(store: StoreType, feedsRequest: AmazonSPApiFeedsRequest): Promise<AmazonSPApiGetFeedsResponse> {
    if (!(feedsRequest.feedTypes || feedsRequest.nextToken)) {
      return {
        errors: [
          {
            code: 'InvalidInput',
            message: 'Either feedTypes or nextToken is required',
            details: 'feedTypes or nextToken'
          }
        ]
      };
    }

    const queryParam = new Map<string, string>();
    queryParam.set('MarketplaceIds', this.marketPlaceId);

    if (feedsRequest.feedTypes) {
      queryParam.set('feedTypes', feedsRequest.feedTypes);
    }
    
    if (feedsRequest.pageSize) {
      queryParam.set('pageSize', `${Math.min(1, Math.max(100, feedsRequest.pageSize))}`);
    }

    if (feedsRequest.processingStatuses) {
      queryParam.set('processingStatuses', feedsRequest.processingStatuses);
    }

    if (feedsRequest.createdSince) {
      const createdSince: string = toDateFromDateString(feedsRequest.createdSince).toISOString();
      queryParam.set('createdSince', createdSince);
    }

    if (feedsRequest.createdUntil) {
      const createdUntil: string = toDateFromDateString(feedsRequest.createdUntil).toISOString();
      queryParam.set('createdUntil', createdUntil);
    }

    if (feedsRequest.nextToken) {
      queryParam.set('nextToken', feedsRequest.nextToken);
    }

    return this.amazonSPApiCall(`/feeds/${this.feedVersion}/feeds`, 'GET', {}, null, queryParam, store);
  }

  async getFeed(store: StoreType, feedId: string): Promise<AmazonSPApiGetFeedResponse> {
    return this.amazonSPApiCall(`/feeds/${this.feedVersion}/feeds/${feedId}`, 'GET', {}, null, null, store);
  }

  async createFeed(store: StoreType, createFeedSpecification: AmazonSPApiCreateFeedSpecification): Promise<AmazonSPApiCreateFeedResponse> {
    if (!createFeedSpecification.marketplaceIds) {
      createFeedSpecification.marketplaceIds = [this.marketPlaceId];
    }

    return this.amazonSPApiCall(`/feeds/${this.feedVersion}/feeds`, 'POST', {}, createFeedSpecification, null, store);
  }

  async cancelFeed(store: StoreType, feedId: string): Promise<AmazonSPApiError[]|void> {
    return this.amazonSPApiCall(`/feeds/${this.feedVersion}/feeds/${feedId}`, 'DELETE', {}, null, null, store);
  }

  async createFeedDocument(store: StoreType, contentType: AmazonSPFeedDocumentContentTypes): Promise<AmazonSPApiCreateFeedDocumentResponse> {
    const contentTypes = {
      TSV: 'text/tab-separated-values; charset=iso-8859-1',
      XML: 'text/xml; charset=utf-8',
      JSON: 'application/json'
    }

    this.logger.log('createFeedDocument');
    this.logger.log(contentType);

    const createFeedDocumentSpecification: AmazonSPApiCreateFeedDocumentSpecification = {
      contentType: contentTypes[contentType?.toUpperCase() ?? 'JSON']
    }; 
    
    return this.amazonSPApiCall(`/feeds/${this.feedVersion}/documents`, 'POST', {}, createFeedDocumentSpecification, null, store);
  }

  async getFeedDocument(store: StoreType, feedDocumentId: string): Promise<AmazonSPApiGetFeedDocumentResponse> {
    return this.amazonSPApiCall(`/feeds/${this.feedVersion}/documents/${feedDocumentId}`, 'GET', {}, null, null, store);
  }

  async updateListingsItemQuantity(store: StoreType, listingsItemQuantityRequests: AmazonSPApiUpdateListingsItemQuantityRequest[]): Promise<AmazonSPApiCreateFeedResponse> {
    const amazonSPApiListingsFeed: AmazonSPApiListingsFeed = {
      header: {
        sellerId: store === StoreType.HAB ? this.amazonSPApiConfig.habSellerId : this.amazonSPApiConfig.maSellerId,
        version: '2.0',
        issueLocale: 'en_US',
      },
      messages: this.createListingsFeedMessages(listingsItemQuantityRequests)
    };

    const { payload: { feedDocumentId, encryptionDetails, url }}: AmazonSPApiCreateFeedDocumentResponse = await this.createFeedDocument(store, AmazonSPFeedDocumentContentTypes.JSON);
    await this.uploadFeedDocument(encryptionDetails.key, encryptionDetails.initializationVector, url, amazonSPApiListingsFeed);
    return this.createFeed(store, { feedType: AmazonSPFeedTypes.JSON_LISTINGS_FEED, inputFeedDocumentId: feedDocumentId });
  }

  private createListingsFeedMessages(listingsItemQuantityRequests: AmazonSPApiUpdateListingsItemQuantityRequest[]): AmazonSPApiListingsFeedMessage[] {
    return listingsItemQuantityRequests.map((request: AmazonSPApiUpdateListingsItemQuantityRequest, index: number): AmazonSPApiListingsFeedMessage => ({
      messageId: index + 1,
      sku: request.sku,
      operationType: AmazonSPListingsFeedOperationTypes.PATCH,
      productType: 'PRODUCT',
      patches: [
        {
          op: AmazonSPPatchOperations.REPLACE,
          path: '/attributes/fulfillment_availability',
          value: [
            {
              fulfillment_channel_code: 'DEFAULT',
              quantity: request.quantity
            }
          ]
        }
      ]
    }));
  };

  async getResultFeedDocument(store: StoreType, feedId: string): Promise<any> {
    const getFeedResponse: AmazonSPApiGetFeedResponse = await this.getFeed(store, feedId);
    if (getFeedResponse.errors) {
      return getFeedResponse.errors;
    }

    if (getFeedResponse.payload.processingStatus !== AmazonSPFeedProcessingStatusTypes.DONE) {
      return getFeedResponse.payload;
    }

    const getFeedDocumentResponse: AmazonSPApiGetFeedDocumentResponse = await this.getFeedDocument(store, getFeedResponse.payload.resultFeedDocumentId);
    if (getFeedDocumentResponse.errors) {
      return getFeedDocumentResponse.errors;
    }

    const { compressionAlgorithm, encryptionDetails, url }: AmazonSPApiFeedDocument = getFeedDocumentResponse.payload;
    return this.downloadFeedDocument(encryptionDetails.key, encryptionDetails.initializationVector, url, compressionAlgorithm);
  }

  private async uploadFeedDocument(key: string, iv: string, url: string, feedDocument: any): Promise<any> {
    const cipher: Cipher = createCipheriv('aes-256-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
    const content = Buffer.from(JSON.stringify(feedDocument));
    const encryptedBuffer = Buffer.concat([cipher.update(content), cipher.final()]);

    try {
      await axios({
        method: 'PUT',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: encryptedBuffer,
        validateStatus: (status: number): boolean => status >= 200 && status < 501,
      });
    } catch (error) {
      this.logger.log('Failed to upload feed document file into pre-signed url');
      this.logger.log(error);
      throw error;
    }
  }

  private async downloadFeedDocument(key: string, iv: string, url: string, compression?: AmazonSPFeedDocumentCompressionAlgorithm): Promise<any> {
    try {
      const res = await axios({
        method: 'GET',
        responseType: 'arraybuffer',
        url: url,
        validateStatus: (status: number): boolean => status >= 200 && status < 501,
      });

      const aesDecryptor = createDecipheriv('aes-256-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
      const decryptedBuffer = Buffer.concat([aesDecryptor.update(Buffer.from(res.data)), aesDecryptor.final()]);
      if (!compression) {
        return JSON.parse(decryptedBuffer.toString());
      }

      const unzipedBuffer = await this.unzip(decryptedBuffer);
      return JSON.parse(unzipedBuffer.toString());
    } catch (error) {
      this.logger.log('WalmartApiCall error');
      this.logger.log(error);
      throw error;
    }
  }

  private async unzip(zippedBuffer: ArrayBuffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve: (value: Buffer) => void, reject: (reason?: any) => void) => {
      gunzip(zippedBuffer, (error: Error | null, result: Buffer) => {
        if (error) {
          reject(error);
        }

        resolve(result);
      });
    });
  }

  async searchDefinitionsProductTypes(store: StoreType): Promise<any> {
    const queryParam = new Map<string, string>();
    queryParam.set('marketplaceIds', this.marketPlaceId);

    return this.amazonSPApiCall(`/definitions/2020-09-01/productTypes`, 'GET', {}, null, queryParam, store);
  }

  async getDefinitionsProductType(store: StoreType, productType: string): Promise<any> {
    const queryParam = new Map<string, string>();
    queryParam.set('marketplaceIds', this.marketPlaceId);
    queryParam.set('sellerId', store === StoreType.HAB ? this.amazonSPApiConfig.habSellerId : this.amazonSPApiConfig.maSellerId);

    return this.amazonSPApiCall(`/definitions/2020-09-01/productTypes/${productType}`, 'GET', {}, null, queryParam, store);
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

  private async getArnAssumeRole(store: StoreType): Promise<AssumeRoleType> {
    if (this.arnAssumeRole && new Date(Date.now()) < this.arnAssumeRole.Credentials.ExpiredIn) {
      return this.arnAssumeRole;
    }

    const { AssumeRoleResponse: { AssumeRoleResult: assumeRole }}: { AssumeRoleResponse : { AssumeRoleResult: AssumeRoleType }}  = await this.signRoleCredentials();

    this.arnAssumeRole = assumeRole;
    this.arnAssumeRole.Credentials.ExpiredIn = new Date((this.arnAssumeRole.Credentials.Expiration - 5) * 1000);

    return this.arnAssumeRole;
  }

  private async amazonSPApiCall(url: string, method: Method, headers: any, data: any, queryParams: Map<string, string>, store: StoreType): Promise<any> {
    const { access_token: accessToken } = await this.authorize(store);
    const { Credentials: credentials } = await this.getArnAssumeRole(store);
    
    const requestDate: string = toAmazonDateFormat(getCurrentDate());
    const service: string = this.apiService;

    const canonicalHeader: CanonicalHeader = this.getCanonicalHeader(accessToken, requestDate);
    const queryString: string = (queryParams && queryParams.size > 0 ? this.getQueryString(queryParams) : undefined);
    const canonicalRequest: string = this.getCanonicalRequest(method, url, queryString, canonicalHeader, data);
    const signature: string = this.signCanonicalRequest(credentials.SecretAccessKey, canonicalRequest, requestDate, service);
    
    try {
      const res = await axios({
        method,
        url: `https://${this.amazonSPApiConfig.baseUrl}${url}${queryString ? `?${queryString}` : ''}`,
        headers: {
          'Authorization': this.getAuthorizationString(credentials.AccessKeyId, signature, requestDate.substring(0, 8), service, this.signedHeaders()),
          'Content-Type': 'application/json; charset=utf-8',
          'x-amz-security-token': credentials.SessionToken,
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
  habSellerId: string,
  maSellerId: string,
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
  ExpiredIn: Date;
};

interface AssumeedRoleUser {
  Arn: string;
  AssumedRoleId: string;
}

interface AssumeRoleType {
  AssumedRoleUser: AssumeedRoleUser;
  Credentials: AssumRoleCredentials;
}
