import { EbayLMSFeedTypes, StoreType } from 'src/types';

export interface EbayApiCreateTaskDto {
  store: StoreType;
  feedType?: EbayLMSFeedTypes; // Default value is LMS_ACTIVE_INVENTORY_REPORT,
  schemaVersion?: string; // Default value is 1.0
}
