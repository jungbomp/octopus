import { Brand } from '../brand.entity';
import { Inventory } from '../inventory.entity';
import { Product } from '../product.entity';
import { ProductOrder } from '../productOrder.entity';
import { User } from '../user.entity';
import { Vendor } from '../vendor.entity';

export class CreateProductOrderDto {
  stdSku: string;
  productCode: string;
  brandCode?: string;
  vendorCode?: string;
  orderQty: number;
  orderDate: string;
  orderTime: string;
  employeeId?: string;

  static toProductOrderEntity(orderSeq: number, dto: CreateProductOrderDto, inventory: Inventory, product: Product, brand?: Brand, vendor?: Vendor, user?: User): ProductOrder {
    const productOrder = new ProductOrder();
    productOrder.orderSeq = orderSeq;
    productOrder.inventory = inventory;
    productOrder.product = product;
    productOrder.brand = brand;
    productOrder.vendor = vendor; 
    productOrder.orderQty = dto.orderQty;
    productOrder.orderDate = dto.orderDate;
    productOrder.orderTime = dto.orderTime;
    productOrder.user = user;
    
    return productOrder;
  }
}
