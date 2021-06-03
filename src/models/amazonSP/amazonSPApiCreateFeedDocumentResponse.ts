import { AmazonSPApiCreateFeedDocumentResult } from './amazonSPApiCreateFeedDocumentResult';
import { AmazonSPApiError } from './amazonSPApiError';

export interface AmazonSPApiCreateFeedDocumentResponse {
  payload: AmazonSPApiCreateFeedDocumentResult;
  errors?: AmazonSPApiError[]
}