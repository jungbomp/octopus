export class LogiwaOrderSearchDto {
  selectedPageIndex: number;
  orderDate: string;
  orderDateStart: string;
  orderDateEnd: string;
  lastModifiedDateStart: string;
  lastModifiedDateEnd: string;
  channelOrderCode: string;
  channelId: number;
  
  constructor(
    selectedPageIndex: number,
    orderDate?: string,
    orderDateStart?: string,
    orderDateEnd?: string,
    lastModifiedDateStart?: string,
    lastModifiedDateEnd?: string,
    channelOrderCode?: string,
    channelId?: number,
  ) {
    this.selectedPageIndex = selectedPageIndex;
    this.orderDate = orderDate;
    this.orderDateStart = orderDateStart;
    this.orderDateEnd = orderDateEnd;
    this.lastModifiedDateStart = lastModifiedDateStart;
    this.lastModifiedDateEnd = lastModifiedDateEnd;
    this.channelOrderCode = channelOrderCode;
    this.channelId = channelId;
  }
}