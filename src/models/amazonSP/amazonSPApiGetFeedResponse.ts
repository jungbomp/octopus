import { AmazonSPApiError } from './amazonSPApiError';
import { AmazonSPApiFeed } from './amazonSPApiFeed';

export interface AmazonSPApiGetFeedResponse {
  payload?: AmazonSPApiFeed;
  errors?: AmazonSPApiError[];
}