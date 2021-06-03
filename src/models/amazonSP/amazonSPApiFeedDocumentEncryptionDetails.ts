import { AmazonSPFeedDocumentStandardEncryptionTypes } from 'src/types';

export interface AmazonSPApiFeedDocumentEncryptionDetails {
  standard: AmazonSPFeedDocumentStandardEncryptionTypes;
  initializationVector: string;
  key: string
}