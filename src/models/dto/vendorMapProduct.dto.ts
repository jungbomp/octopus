export class VendorMapProduct {
  vendorCode: string;
  productCode: string;
  productTitle: string;
  packInfo: number;
  orderBySize: string;
  manufacturingCode: string;

  constructor(
    vendorCode: string,
    productCode: string,
    productTitle: string,
    packInfo: number,
    orderBySize: string,
    manufacturingCode: string
  ) {
    this.vendorCode = vendorCode;
    this.productCode = productCode;
    this.productTitle = productTitle;
    this.packInfo = packInfo;
    this.orderBySize = orderBySize;
    this.manufacturingCode = manufacturingCode;
  }
}