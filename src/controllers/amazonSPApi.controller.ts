import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { AmazonSPApiCreateFeedDocumentResponse } from 'src/models/amazonSP/amazonSPApiCreateFeedDocumentResponse';
import { AmazonSPApiCreateFeedResponse } from 'src/models/amazonSP/amazonSPApiCreateFeedResponse';
import { AmazonSPApiCreateFeedSpecification } from 'src/models/amazonSP/amazonSPApiCreateFeedSpecification';
import { AmazonSPApiError } from 'src/models/amazonSP/amazonSPApiError';
import { AmazonSPApiFeedsRequest } from 'src/models/amazonSP/amazonSPApiGetFeedsRequest';
import { AmazonSPApiGetFeedDocumentResponse } from 'src/models/amazonSP/amazonSPApiGetFeedDocumentResponse';
import { AmazonSPApiGetFeedResponse } from 'src/models/amazonSP/amazonSPApiGetFeedResponse';
import { AmazonSPApiOrdersRequest } from 'src/models/amazonSP/amazonSPApiOrdersRequest';
import { AmazonSPApiService } from 'src/services/amazonSPApi.service';
import { AmazonSPApiUpdateListingsItemQuantityRequest } from 'src/models/amazonSP/amazonSPApiUpdateListingsItemQuantityRequest';
import { AmazonSPFeedDocumentContentTypes, AmazonSPFeedTypes, AmazonSPFeedProcessingStatuses, StoreType } from 'src/types';

@Controller('amazon-sp-api/:store')
export class AmazonSPApiController {
  constructor(private readonly amazonSPApiService: AmazonSPApiService) {}

  @Get('marketplace-participations')
  getMarketplaceParticipations(@Param('store') store: StoreType): Promise<any> {
    return this.amazonSPApiService.getMarketplaceParticipations(store);
  }

  @Patch('listings-item/:sku')
  putListingsItem(@Param('store') store: StoreType, @Param('sku') sku: string): Promise<any> {
    return this.amazonSPApiService.putListingsItem(store, sku);
  }

  @Get('orders')
  getOrders(@Param('store') store: StoreType,
    @Query('CreatedAfter') createdAfter?: string,
    @Query('CreatedBefore') createdBefore?: string,
    @Query('LastUpdatedAfter') lastUpdatedAfter?: string,
    @Query('LastUpdatedBefore') lastUpdatedBefore?: string,
    @Query('OrderStatuses') orderStatus?: string,
    @Query('NextToken') nextToken?: string
  ): Promise<any> {
    const ordersRequest: AmazonSPApiOrdersRequest = {
      createdAfter,
      createdBefore,
      lastUpdatedAfter,
      lastUpdatedBefore,
      orderStatus,
      nextToken
    };

    return this.amazonSPApiService.getOrders(store, ordersRequest);
  }

  @Get('order/:orderId')
  getOrder(@Param('store') store: StoreType, @Param('orderId') orderId: string): Promise<any> {
    return this.amazonSPApiService.getOrder(store, orderId);
  }

  @Get('feeds')
  getFeeds(@Param('store') store: StoreType,
    @Query('feedTypes') feedTypes?: AmazonSPFeedTypes,
    @Query('pageSize') pageSize?: string,
    @Query('processingStatuses') processingStatuses?: AmazonSPFeedProcessingStatuses,
    @Query('createdSince') createdSince?: string,
    @Query('createdUntil') createdUntil?: string,
    @Query('nextToken') nextToken?: string
  ): Promise<any> {
    const feedsRequest: AmazonSPApiFeedsRequest = {
      feedTypes,
      pageSize: pageSize ? Number(pageSize) : undefined,
      processingStatuses,
      createdSince,
      createdUntil,
      nextToken
    };

    return this.amazonSPApiService.getFeeds(store, feedsRequest);
  }

  @Get('feed/:feedId')
  getFeed(@Param('store') store: StoreType, @Param('feedId') feedId: string): Promise<AmazonSPApiGetFeedResponse> {
    return this.amazonSPApiService.getFeed(store, feedId);
  }

  @Post('feed')
  createFeed(@Param('store') store: StoreType, @Body() createFeedSpecification: AmazonSPApiCreateFeedSpecification): Promise<AmazonSPApiCreateFeedResponse> {
    return this.amazonSPApiService.createFeed(store, createFeedSpecification);
  }

  @Delete('feed/:feedId')
  cancelFeed(@Param('store') store: StoreType, @Param('feedId') feedId: string): Promise<AmazonSPApiError[]|void> {
    return this.amazonSPApiService.cancelFeed(store, feedId);
  }

  @Get('feed/:feedId/result-feed-document')
  getResultFeedDocument(@Param('store') store: StoreType, @Param('feedId') feedId: string): Promise<any> {
    return this.amazonSPApiService.getResultFeedDocument(store, feedId);
  }

  @Post('feed-document')
  createFeedDocument(@Param('store') store: StoreType, @Query('contentType') contentType?: AmazonSPFeedDocumentContentTypes): Promise<AmazonSPApiCreateFeedDocumentResponse> {
    return this.amazonSPApiService.createFeedDocument(store, contentType);
  }

  @Get('feed-document/:feedDocumentId')
  getFeedDocument(@Param('store') store: StoreType, @Param('feedDocumentId') feedDocumentId: string): Promise<AmazonSPApiGetFeedDocumentResponse> {
    return this.amazonSPApiService.getFeedDocument(store, feedDocumentId);
  }

  @Post('feed/update-istings-item-quantity')
  uploadFeedDocument(@Param('store') store: StoreType, @Body() requests: AmazonSPApiUpdateListingsItemQuantityRequest[]): Promise<any> {
    return this.amazonSPApiService.updateListingsItemQuantity(store, requests);
  }

  @Get('search-definitions-product-types')
  searchDefinitionsProductTypes(@Param('store') store: StoreType): Promise<any> {
    return this.amazonSPApiService.searchDefinitionsProductTypes(store);
  }

  @Get('definitions-product-type/:productType')
  getDefinitionsProductType(@Param('store') store: StoreType, @Param('productType') productType: string): Promise<any> {
    return this.amazonSPApiService.getDefinitionsProductType(store, productType);
  }
}
