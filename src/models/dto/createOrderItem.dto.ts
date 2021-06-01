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

  static toOrderItem(dto: CreateOrderItemDto, order: Orders, inventory: Inventory): OrderItem {
    const orderItem = new OrderItem();
    orderItem.order = order;
    orderItem.listingSku = dto.listingSku;
    orderItem.inventory = inventory
    orderItem.unitPrice = dto.unitPrice;
    orderItem.unitQuantity = dto.unitQuantity;

    return orderItem;
  }
}