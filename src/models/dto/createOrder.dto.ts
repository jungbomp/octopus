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
  
  static toOrder(dto: CreateOrderDto, market: Market, user?: User): Orders {
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
    order.user = user;
  
    return order;
  }
}
