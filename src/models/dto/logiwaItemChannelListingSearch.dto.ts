export interface LogiwaItemChannelListingSearchDto {
  pageSize?: number; // Default is 200
  selectedPageIndex?: number; // Default is 1
  channelId?: number; // (1: Amazon, 2: Ebay, 3: Shopify, 5: AmazonFBA, 9: Sears, 54: Walmart v3)
  inventoryItemId?: string;
}