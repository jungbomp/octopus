import { AmazonSPApiError } from './amazonSPApiError';
import { AmazonSPApiFeed } from './amazonSPApiFeed';

export interface AmazonSPApiGetFeedsResponse {
  payload?: AmazonSPApiFeed[];
  nextToken?: string;
  errors?: AmazonSPApiError[];
}