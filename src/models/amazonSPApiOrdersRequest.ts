export interface AmazonSPSpiOrdersRequest {
  marketplaceIds?: string,
  createdAfter?: string,
  createdBefore?: string,
  lastUpdatedAfter?: string,
  lastUpdatedBefore?: string,
  orderStatus?: string,
  fulfillmentChannels?: string,
  paymentMethods?: string,
  buyerEmail?: string,
  sellerOrderId?: string,
  maxResultsPerPage?: number, // 1 - 100, Default: 100
  easyShipShipmentStatuses?: string,
  nextToken?: string,
  amazonOrderIds?: string, // Amazon-defined order identifier, in 3-7-7 format
  actualFulfillmentSupplySourceId?: string,
  isIspu?: boolean,
  storeChainStoreId?: string
};