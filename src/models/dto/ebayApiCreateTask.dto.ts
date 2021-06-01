import { StoreType } from 'src/types';

export interface EbayApiCreateTaskDto {
  store: StoreType;
  feedType?: string; // Default value is LMS_ACTIVE_INVENTORY_REPORT,
  schemaVersion?: string; // Default value is 1.0
}