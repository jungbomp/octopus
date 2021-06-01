import { StoreType } from 'src/types';

export interface WalmartApiGetItemsDto {
  store: StoreType;
  limit?: number;
  nextCursor?: string;
  createDateFrom?: string;
  createDateTo?: string;
  lastModifiedDateFrom?: string;
  lastModifiedDateTo?: string;
}