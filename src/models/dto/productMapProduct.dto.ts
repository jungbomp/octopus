export class ProductMapProduct {
    productCode: string;
    stdSku: string;
    productColor: string;
    sizeCode: string;
    shortSizeCode: string;
    sizeOrder: number;
  
    constructor(
      productCode: string,
      stdSku: string,
      productColor: string,
      sizeCode: string,
      shortSizeCode: string,
      sizeOrder: number
    ) {
      this.productCode = productCode;
      this.stdSku = stdSku;
      this.productColor = productColor;
      this.sizeCode = sizeCode;
      this.shortSizeCode = shortSizeCode;
      this.sizeOrder = sizeOrder;
    }
  }