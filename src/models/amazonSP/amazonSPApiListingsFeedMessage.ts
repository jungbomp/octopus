import { AmazonSPListingsFeedOperationTypes, AmazonSPListingsFeedRequirements } from 'src/types';
import { AmazonSPApiPatchOperation } from './amazonSPApiPatchOperation';

export interface AmazonSPApiListingsFeedMessage {
  messageId: number;
  sku: string;
  operationType: AmazonSPListingsFeedOperationTypes;
  productType: string;
  requirements?: AmazonSPListingsFeedRequirements;
  attributes?: any;
  patches?: AmazonSPApiPatchOperation[];
}