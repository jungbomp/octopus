import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AmazonSPApiCreateFeedDocumentResponse } from 'src/models/amazonSP/amazonSPApiCreateFeedDocumentResponse';
import { AmazonSPApiCreateFeedResponse } from 'src/models/amazonSP/amazonSPApiCreateFeedResponse';
import { AmazonSPApiCreateFeedSpecification } from 'src/models/amazonSP/amazonSPApiCreateFeedSpecification';
import { AmazonSPApiError } from 'src/models/amazonSP/amazonSPApiError';
import { AmazonSPApiFeedsRequest } from 'src/models/amazonSP/amazonSPApiGetFeedsRequest';
import { AmazonSPApiGetFeedDocumentResponse } from 'src/models/amazonSP/amazonSPApiGetFeedDocumentResponse';
import { AmazonSPApiGetFeedResponse } from 'src/models/amazonSP/amazonSPApiGetFeedResponse';
import { AmazonSPApiOrdersRequest } from 'src/models/amazonSP/amazonSPApiOrdersRequest';
import { AmazonSPApiService } from 'src/services/amazonSPApi.service';
import { AmazonSPFeedDocumentContentTypes, AmazonSPFeedTypes, AmazonSPFeedProcessingStatuses, StoreType } from 'src/types';

@Controller('amazon-sp-api/:store')
export class AmazonSPApiController {
  constructor(private readonly amazonSPApiService: AmazonSPApiService) {}

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

  @Post('feed-document')
  createFeedDocument(@Param('store') store: StoreType, @Query('contentType') contentType?: AmazonSPFeedDocumentContentTypes): Promise<AmazonSPApiCreateFeedDocumentResponse> {
    return this.amazonSPApiService.createFeedDocument(store, contentType);
  }

  @Get('feed-document/:feedDocumentId')
  getFeedDocument(@Param('store') store: StoreType, @Param('feedDocumentId') feedDocumentId: string): Promise<AmazonSPApiGetFeedDocumentResponse> {
    return this.amazonSPApiService.getFeedDocument(store, feedDocumentId);
  }
}
