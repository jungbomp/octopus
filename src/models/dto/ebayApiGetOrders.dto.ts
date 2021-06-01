export interface EbayApiGetOrdersDto {
  limit: number;
  offset: number;
  creationDateFrom?: string;
  creationDateTo?: string;
  lastModifiedDateFrom?: string;
  lastModifiedDateTo?: string;
}