import { EbayApiCreateTaskDto } from './ebayApiCreateTask.dto';

export interface EbayApiCreateInventoryTaskDto extends EbayApiCreateTaskDto {
  creationDateFrom?: string;
  creationDateTo?: string;
  modifiedDateFrom?: string;
  modifiedDateTo?: string;
  
}