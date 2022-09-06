export interface LogiwaInventoryitemSearchDto {
  pageSize?: number; // Default is 200
  selectedPageIndex?: number; // Default is 1
  code?: string; // stdSku
  id?: number; // inventoryItemId
  lastModifiedDate?: string; // yyyymmddhh24miss
  lastModifiedDateStart?: string; // yyyymmddhh24miss
  lastModifiedDateEnd?: string; // yyyymmddhh24miss
}
