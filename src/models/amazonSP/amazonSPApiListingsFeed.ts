import { AmazonSPApiListingsFeedHeader } from './amazonSPApiListingsFeedsHeader';
import { AmazonSPApiListingsFeedMessage } from './amazonSPApiListingsFeedMessage';

export interface AmazonSPApiListingsFeed {
  header: AmazonSPApiListingsFeedHeader;
  messages: AmazonSPApiListingsFeedMessage[];
}