import { AmazonSPFeedProcessingStatusTypes, AmazonSPFeedTypes } from 'src/types';

export interface AmazonSPApiFeed {
  feedId: string;
  feedType: AmazonSPFeedTypes;
  marketplaceIds?: string;
  createdTime?: string;
  processingStatus: AmazonSPFeedProcessingStatusTypes;
  processingStartTime?: string;
  processingEndTime?: string;
  resultFeedDocumentId?: string;
}