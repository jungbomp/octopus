import { AmazonSPApiCreateFeedResult } from './amazonSPApiCreateFeedResult';
import { AmazonSPApiError } from './amazonSPApiError';

export interface AmazonSPApiCreateFeedResponse {
  payload?: AmazonSPApiCreateFeedResult;
  errors?: AmazonSPApiError[]
}