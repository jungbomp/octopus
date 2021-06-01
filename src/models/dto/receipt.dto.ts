import { ReceiptDetailDto } from './receiptDetail.dto';

export class ReceiptDto {
  receiptDate: string;
  orderSeq: number;
  supplier: string;
  details: ReceiptDetailDto[];
  depositor: string;
  warehouse: string;
  warehouseReceiptType: string;

  constructor(
    receiptDate: string,
    orderSeq: number,
    supplier: string,
    details: ReceiptDetailDto[],
    depositor?: string,
    warehouse?: string,
    warehouseReceiptType?: string,
  ) {
    this.receiptDate = receiptDate;
    this.orderSeq = orderSeq;
    this.supplier = supplier;
    this.details = details;
    this.depositor = depositor || 'Hat and Beyond';
    this.warehouse = warehouse || 'HB';
    this.warehouseReceiptType = warehouseReceiptType || 'Count';
  }
}