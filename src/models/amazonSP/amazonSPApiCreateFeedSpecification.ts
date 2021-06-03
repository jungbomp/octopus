import { AmazonSPFeedTypes } from 'src/types';

export interface AmazonSPApiCreateFeedSpecification {
  feedType: AmazonSPFeedTypes;
  marketplaceIds?: string;
  inputFeedDocumentId: string;
  feedOptions?: Map<string, string>;
}