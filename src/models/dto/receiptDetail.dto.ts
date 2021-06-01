export class ReceiptDetailDto {
  itemCode: string;
  itemPackType: string;
  plannedPackQuantity: number;

  constructor(
    itemCode: string,
    plannedPackQuantity: number,
    itemPackType?: string,
  ) {
    this.itemCode = itemCode;
    this.plannedPackQuantity = plannedPackQuantity;
    this.itemPackType = itemPackType || 'Unit'
  }
}