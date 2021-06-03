import { AmazonSPApiFeedDocumentEncryptionDetails } from './amazonSPApiFeedDocumentEncryptionDetails';

export interface AmazonSPApiCreateFeedDocumentResult {
  feedDocumentId: string;
  url: string;
  encryptionDetails: AmazonSPApiFeedDocumentEncryptionDetails;
}