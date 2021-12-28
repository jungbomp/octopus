import { Inventory } from '../inventory.entity';
import { OrderItem } from '../orderItem.entity';
import { Orders } from '../orders.entity';

export class CreateOrderItemDto {
  channelOrderCode: string;
  marketId: number;
  listingSku: string;
  stdSku: string;
  unitPrice: number;
  unitQuantity: number;
  garmentCost: number;

  static toOrderItem(dto: CreateOrderItemDto, order: Orders, inventory: Inventory): OrderItem {
    const orderItem = new OrderItem();
    orderItem.order = order;
    orderItem.listingSku = dto.listingSku;
    orderItem.inventory = inventory;
    orderItem.unitPrice = dto.unitPrice;
    orderItem.unitQuantity = dto.unitQuantity;
    orderItem.garmentCost = dto.garmentCost;

    return orderItem;
  }

  static fromOrderItem(orderItem: OrderItem): CreateOrderItemDto {
    const dto = new CreateOrderItemDto();
    dto.channelOrderCode = orderItem.order.channelOrderCode;
    dto.marketId = orderItem.order.market.marketId;
    dto.listingSku = orderItem.listingSku;
    dto.stdSku = orderItem.inventory?.stdSku;
    dto.unitPrice = orderItem.unitPrice;
    dto.unitQuantity = orderItem.unitQuantity;
    dto.garmentCost = orderItem.garmentCost;

    return dto;
  }
}
