import { AmazonSPFulfillmentCarrierCode } from 'src/types';

export interface AmazonSPApiUpdateOrderFulfillmentRequest {
  amazonOrderId: string;
  fulfillmentDate: string;
  carrierCode: AmazonSPFulfillmentCarrierCode;
  shippingMethod?: string;
  shipperTrackingNumber: string;
}