import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AmazonSPSpiOrdersRequest } from 'src/models/amazonSPApiOrdersRequest';
import { AmazonSPApiService } from 'src/services/amazonSPApi.service';
import { StoreType } from 'src/types';

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
    const ordersRequest : AmazonSPSpiOrdersRequest = {
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


}
