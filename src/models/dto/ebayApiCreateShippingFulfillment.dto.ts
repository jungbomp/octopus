export interface EbayApiCreateShippingFulfillmentDto {
  orderId: string;
  lineItems: { limeItemId: string, quantity: number }[];
  trackingNumber: string;
  shippingCarrierCode: string;
  shippedDate?: string;
}

