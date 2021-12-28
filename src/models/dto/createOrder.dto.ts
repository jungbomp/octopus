import { Orders } from '../orders.entity';
import { Market } from '../market.entity';
import { User } from '../user.entity';
import { CreateOrderItemDto } from './createOrderItem.dto';

export class CreateOrderDto {
  channelOrderCode: string;
  marketId: number;
  orderDate: string;
  orderQty: number;
  orderPrice: number;
  orderShippingPrice: number;
  shippingPrice: number;
  shippingStatus: string;
  trackingNo: string;
  employeeId: string;
  orderItems: CreateOrderItemDto[];
  zipcode?: string;
  masterChannelOrderCode?: string;
  masterMarketId?: number;
  trackingNumberUpdateDttm?: string;
  shippingDttm?: string;

  static toOrder(dto: CreateOrderDto, market: Market, user?: User, masterOrder?: Orders): Orders {
    const order = new Orders();
    order.channelOrderCode = dto.channelOrderCode;
    order.market = market;
    order.orderDate = dto.orderDate;
    order.orderQty = dto.orderQty;
    order.orderPrice = dto.orderPrice;
    order.orderShippingPrice = dto.orderShippingPrice;
    order.shippingPrice = dto.shippingPrice;
    order.shippingStatus = dto.shippingStatus;
    order.trackingNo = dto.trackingNo;
    order.zipcode = dto.zipcode;
    order.user = user;
    order.masterOrder = masterOrder;
    order.trackingNumberUpdateDttm = dto.trackingNumberUpdateDttm;
    order.shippingDttm = dto.shippingDttm;

    return order;
  }

  static fromOrder(order: Orders): CreateOrderDto {
    const dto = new CreateOrderDto();
    dto.channelOrderCode = order.channelOrderCode;
    dto.marketId = order.market.marketId;
    dto.orderDate = order.orderDate;
    dto.orderQty = order.orderQty;
    dto.orderPrice = order.orderPrice;
    dto.orderShippingPrice = order.orderShippingPrice;
    dto.shippingPrice = order.shippingPrice;
    dto.shippingStatus = order.shippingStatus;
    dto.trackingNo = order.trackingNo;
    dto.employeeId = order.user?.employeeId;
    dto.orderItems = order.orderItems.map(CreateOrderItemDto.fromOrderItem);
    dto.zipcode = order.zipcode;
    dto.masterChannelOrderCode = order.masterOrder?.channelOrderCode;
    dto.masterMarketId = order.masterOrder?.market.marketId;
    dto.trackingNumberUpdateDttm = order.trackingNumberUpdateDttm;
    dto.shippingDttm = order.shippingDttm;

    return dto;
  }
}
