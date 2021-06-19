import { AmazonSPPatchOperations } from 'src/types'
import { AmazonSPApiPatchOperationValueType } from './amazonSPApiPatchOperaionValueType';

export interface AmazonSPApiPatchOperation {
  op: AmazonSPPatchOperations,
  path: string,
  value: AmazonSPApiPatchOperationValueType[]
};