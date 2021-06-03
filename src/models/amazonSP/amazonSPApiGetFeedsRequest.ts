import { AmazonSPFeedTypes, AmazonSPFeedProcessingStatuses } from 'src/types'

export interface AmazonSPApiFeedsRequest {
  feedTypes?: AmazonSPFeedTypes;
  marketplaceIds?: string;
  pageSize?: number, // default is 10, minimum is 1 and maximum is 100
  processingStatuses?: AmazonSPFeedProcessingStatuses;
  createdSince?: string;
  createdUntil?: string;
  nextToken?: string;
}