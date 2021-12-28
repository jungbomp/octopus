import { EbayLMSFeedTypes, StoreType } from 'src/types';

export interface EbayApiGetTasksDto {
  store: StoreType;
  feedType?: EbayLMSFeedTypes;
  lookBackDays?: number; // Default: 7, Range: 1-90
  dateRange?: string; // yyyy-MM-ddThh:mm:ss.SSSZ..yyyy-MM-ddThh:mm:ss.SSSZ
  limit?: number; // Default: 10, Maximum: 500
  offset?: number; // Default: 0
}
