import { StoreType } from 'src/types';

export interface EbayApiGetOrderDto {
  store: StoreType;
  orderId: string;
}