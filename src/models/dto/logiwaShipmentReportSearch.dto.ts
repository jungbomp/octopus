export interface LogiwaShipmentReportSearchDto {
  selectedPageIndex?: number;
  orderDateStart?: string;
  orderDateEnd?: string;
  channelOrderCode?: string;
  carrierTrackingNumber?: string;
  channelId?: number;
  warehouseOrderID?: number;
  warehouseOrderCode?: string;
}
