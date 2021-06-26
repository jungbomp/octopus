import { AmazonSPFulfillmentCarrierCode } from 'src/types';

export interface AmazonSPApiOrderFulfillmentFeedMessage {
  OrderFulfillment: {
    AmazonOrderID: string;
    FulfillmentDate: string;
    FulfillmentData: {
      CarrierCode?: AmazonSPFulfillmentCarrierCode;
      CarrierName?: string;
      ShippingMethod?: string;
      ShipperTrackingNumber?: string;
    }
  }
}