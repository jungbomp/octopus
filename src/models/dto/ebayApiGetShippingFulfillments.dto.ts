import { StoreType } from 'src/types';

export interface EbayApiGetShippingFulfillmentsDto {
  store: StoreType;
  orderId: string;
}