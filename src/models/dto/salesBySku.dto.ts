export interface SalesBySkuDto {
  orderDate: string;
  productCode: string;
  stdSku: string;
  listingSku: string;
  productName: string;
  totalQuantity: number;
  hbAmazonQuantity: number;
  hbEbayQuantity: number;
  hbSearsQuantity: number;
  hbWalmartQuantity: number;
  hbShopifyQuantity: number;
  mxAmazonQuantity: number;
  mxEbayQuantity: number;
  mxWalmartQuantity: number;
}
