import { AmazonSPFeedDocumentCompressionAlgorithm } from 'src/types';
import { AmazonSPApiFeedDocumentEncryptionDetails } from './amazonSPApiFeedDocumentEncryptionDetails';

export interface AmazonSPApiFeedDocument {
  feedDocumentId: string;
  url: string;
  encryptionDetails: AmazonSPApiFeedDocumentEncryptionDetails;
  compressionAlgorithm: AmazonSPFeedDocumentCompressionAlgorithm;
}