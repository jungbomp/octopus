import { AmazonSPApiError } from './amazonSPApiError';
import { AmazonSPApiFeedDocument } from './amazonSPApiFeedDocument';

export interface AmazonSPApiGetFeedDocumentResponse {
  payload: AmazonSPApiFeedDocument;
  errors?: AmazonSPApiError[];
}