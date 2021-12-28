import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'fs';
// import { readFileSync, writeFileSync } from 'fs';
import { render } from 'ejs';
import * as puppeteer from 'puppeteer';
import { Brand } from '../models/brand.entity';
import { Inventory } from '../models/inventory.entity';
import { Product } from '../models/product.entity';
import { ProductOrder } from '../models/productOrder.entity';
import { User } from '../models/user.entity';
import { Vendor } from '../models/vendor.entity';
import { VendorsService } from './vendors.service';
import { CreateProductOrderDto } from '../models/dto/createProductOrder.dto';
import { BrandsService } from './brands.service';
import { InventoriesService } from './inventories.service';
import { ProductsService } from './products.service';
import { UsersService } from './users.service';
import { LogiwaService } from './logiwa.service';
import { ReceiptDto } from '../models/dto/receipt.dto';
import { ReceiptDetailDto } from '../models/dto/receiptDetail.dto';
import { ProductMapsService } from './productMaps.service';
import { ManufacturingMapsService } from './manufacturingMaps.service';
import { SendGridService } from './sendGrid.service';
import { GoogleApiService } from './googleApi.service';
import { getCurrentDate, getCurrentDttm, getDttmFromDate, getTimeFormatFromDate } from '../utils/dateTime.util';
import { ConfigService } from '@nestjs/config';
import { ENV, ENVIRONMENT } from 'src/constants';

@Injectable()
export class ProductOrdersService {
  private readonly logger = new Logger(ProductOrdersService.name);
  private orderFormConfig: OrderFormConfig = null;

  constructor(
    @InjectRepository(ProductOrder)
    private readonly productOrdersRepository: Repository<ProductOrder>,
    private readonly configService: ConfigService,
    private readonly brandsService: BrandsService,
    private readonly inventoriesService: InventoriesService,
    private readonly manufacturingMapsService: ManufacturingMapsService,
    private readonly productsService: ProductsService,
    private readonly productMapsService: ProductMapsService,
    private readonly usersService: UsersService,
    private readonly vendorsService: VendorsService,
    private readonly googleApiService: GoogleApiService,
    private readonly logiwaService: LogiwaService,
    private readonly sendGridService: SendGridService,
  ) {
    this.orderFormConfig = this.configService.get<OrderFormConfig>('orderForm');
    if (this.configService.get<string>(ENVIRONMENT) == ENV.PRODUCTION) {
      this.setCurrentGoogleSheetFileId();
    }
  }

  async findAll(stdSku: string): Promise<ProductOrder[]> {
    if ((stdSku || null) === null) {
      return this.productOrdersRepository.find();
    }

    return this.productOrdersRepository.find({ inventory: { stdSku } });
  }

  async find(orderSeq: number, stdSku?: string): Promise<ProductOrder[]> {
    const option = {
      orderSeq,
    };

    return this.productOrdersRepository.find(
      stdSku
        ? {
            ...option,
            inventory: { stdSku },
          }
        : option,
    );
  }

  async create(createProductOrderDto: CreateProductOrderDto): Promise<ProductOrder> {
    const orderSeq =
      (
        (await this.productOrdersRepository
          .createQueryBuilder('productOrder')
          .orderBy('productOrder.orderSeq', 'DESC')
          .limit(1)
          .getOne()) || { orderSeq: 0 }
      ).orderSeq + 1;

    const inventory = await this.inventoriesService.findOne(createProductOrderDto.stdSku);
    const product = await this.productsService.findOne(createProductOrderDto.productCode, false);
    const brand = createProductOrderDto.brandCode
      ? await this.brandsService.findOne(createProductOrderDto.brandCode)
      : undefined;

    const vendor = createProductOrderDto.vendorCode
      ? await this.vendorsService.findOne(createProductOrderDto.vendorCode)
      : undefined;

    const user = createProductOrderDto.employeeId
      ? await this.usersService.findOne(createProductOrderDto.employeeId)
      : undefined;

    const productOrder = CreateProductOrderDto.toProductOrderEntity(
      orderSeq,
      createProductOrderDto,
      inventory,
      product,
      brand,
      vendor,
      user,
    );

    return this.productOrdersRepository.save(productOrder);
  }

  private async getNextSeq(): Promise<number> {
    const curSeq: { orderSeq: number } = await this.productOrdersRepository
      .createQueryBuilder('productOrder')
      .orderBy('productOrder.orderSeq', 'DESC')
      .limit(1)
      .getOne();

    return (curSeq?.orderSeq ?? 0) + 1;
  }

  private toProductOrderFromCreateProductOrderDto(dto: CreateProductOrderDto, orderSeq: number): ProductOrder {
    const inventory = new Inventory();
    inventory.stdSku = dto.stdSku;

    const product = new Product();
    product.productCode = dto.productCode;

    const brand = new Brand();
    brand.brandCode = dto.brandCode;

    const vendor = new Vendor();
    vendor.vendorCode = dto.vendorCode;

    const user = new User();
    user.employeeId = dto.employeeId;

    return CreateProductOrderDto.toProductOrderEntity(
      orderSeq,
      dto,
      inventory,
      product,
      dto.brandCode ? brand : undefined,
      dto.vendorCode ? vendor : undefined,
      dto.employeeId ? user : undefined,
    );
  }

  async createBatch(createProductOrderDtos: CreateProductOrderDto[]): Promise<ProductOrder[]> {
    const nextOrderSeq = await this.getNextSeq();

    const productOrders = createProductOrderDtos.map(
      (dto: CreateProductOrderDto): ProductOrder => this.toProductOrderFromCreateProductOrderDto(dto, nextOrderSeq),
    );

    const savedProductOrders = await this.productOrdersRepository.save(productOrders);

    this.sendLogiwaReceipt(savedProductOrders);
    this.sendOrderEmails(savedProductOrders).then(console.log);

    return savedProductOrders;
  }

  async getOrderDetail(orderSeq: number): Promise<any> {
    const productOrders = await this.find(orderSeq);
    return await this.buildOrderDetailsFromProductOrders(productOrders);
  }

  async forceSendOrderEmails(orderSeq: number): Promise<any> {
    const productOrders = await this.find(orderSeq);
    return await this.sendOrderEmails(productOrders);
  }

  async exportOrderDetailsToGoogleSheet(createProductOrderDtos: CreateProductOrderDto[]): Promise<any> {
    let latestFileId: string = this.orderFormConfig.latestSheetFileId ?? (await this.setCurrentGoogleSheetFileId());

    const curDate: Date = getCurrentDate();

    const productOrders = createProductOrderDtos.map(
      (dto: CreateProductOrderDto): ProductOrder => this.toProductOrderFromCreateProductOrderDto(dto, 0),
    );

    const orderDetails = await this.buildOrderDetailsFromProductOrders(productOrders);

    // Get latest google spread shhet file in the orderform folder
    // const children = await this.googleApiService.getFolderChildren(this.orderFormConfig.orderFormFolderId, null);
    // const childrenMeta = await Promise.all(children.map(async (child: { id: string; }) => await this.googleApiService.getFileMetadata(child.id)));
    // const latestFileMeta = childrenMeta.sort((child1, child2) => parseInt(child2.title.substring(child2.title.lastIndexOf('_')+1)) - parseInt(child1.title.substring(child1.title.lastIndexOf('_')+1))).pop();
    let latestFileMeta = await this.googleApiService.getFileMetadata(latestFileId);

    // Create a new google spread sheet file if it is needed
    const curYearAndMonth = Number(getDttmFromDate(curDate).substring(0, 6));
    if (parseInt(latestFileMeta.title.substring(latestFileMeta.title.lastIndexOf('_') + 1)) < curYearAndMonth) {
      latestFileId = await this.googleApiService.createSpreadFile(
        `${latestFileMeta.title.substring(0, latestFileMeta.title.lastIndexOf('_'))}_${curYearAndMonth}`,
      );

      latestFileMeta = await this.googleApiService.getFileMetadata(latestFileId);
      await this.googleApiService.patchFile(
        latestFileId,
        latestFileMeta.title,
        this.orderFormConfig.orderFormFolderId,
        latestFileMeta.parents[0].id,
      );
      this.orderFormConfig.latestSheetFileId = latestFileId;
    }

    // Create a new sheet into the file
    const day = curDate.getDate();
    const time = getTimeFormatFromDate(curDate);
    const title = `${day}${1 === day ? 'st' : 2 === day ? 'nd' : 3 === day ? 'rd' : 'th'} ${time}`;
    const sheetMeta = await this.googleApiService.spreadSheetUpdate(latestFileId, [
      { addSheet: { properties: { title } } },
    ]);
    const sheetId = sheetMeta.replies[0].addSheet.properties.sheetId;

    const data = [];
    const sheetAction = [];
    let curRow = 1;

    orderDetails.orderDetails.forEach((orderDetail) => {
      orderDetail.orderVariants.forEach((orderVariant) => {
        const lastSizeCol = String.fromCharCode('E'.charCodeAt(0) + orderVariant.sizeVariants.length - 1);
        const totalCol = String.fromCharCode(lastSizeCol.charCodeAt(0) + 1);

        data.push({
          range: `${title}!A${curRow}:${totalCol}${curRow}`,
          values: [['VENDOR', 'ITEM', 'NAME', 'COLOR', ...orderVariant.sizeVariants, 'TOTAL QTY']],
        });

        curRow++;

        data.push({
          range: `${title}!A${curRow}:C${curRow}`,
          values: [
            [
              orderVariant.product.brand.brandName +
                ((orderDetail.vendor || undefined) !== undefined ? ` (${orderDetail.vendor.vendorName})` : ''),
              orderVariant.product.productCode,
              orderVariant.product.productTitle,
            ],
          ],
        });

        data.push({
          range: `${title}!D${curRow}:${lastSizeCol}${curRow + orderVariant.colorVariants.length - 1}`,
          values: [
            ...orderVariant.colorVariants.map((color, i) => [
              color,
              ...orderVariant.orderVariantTable[i].map((v) => (0 < v ? '' + v : '')),
            ]),
          ],
        });

        data.push({
          range: `${title}!${totalCol}${curRow}:${totalCol}${curRow}`,
          values: [[orderVariant.totalQuantity]],
        });

        sheetAction.push({
          mergeCells: {
            range: {
              sheetId,
              startRowIndex: curRow - 1,
              endRowIndex: curRow + orderVariant.colorVariants.length - 1,
              startColumnIndex: 0,
              endColumnIndex: 3,
            },
            mergeType: 'MERGE_COLUMNS',
          },
        });

        sheetAction.push({
          mergeCells: {
            range: {
              sheetId,
              startRowIndex: curRow - 1,
              endRowIndex: curRow + orderVariant.colorVariants.length - 1,
              startColumnIndex: totalCol.charCodeAt(0) - 'A'.charCodeAt(0),
              endColumnIndex: totalCol.charCodeAt(0) - 'A'.charCodeAt(0) + 1,
            },
            mergeType: 'MERGE_COLUMNS',
          },
        });

        const border = {
          style: 'SOLID',
          width: 1,
          color: {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 1,
          },
        };

        sheetAction.push({
          updateBorders: {
            range: {
              sheetId,
              startRowIndex: curRow - 2,
              endRowIndex: curRow + orderVariant.colorVariants.length - 1,
              startColumnIndex: 0,
              endColumnIndex: totalCol.charCodeAt(0) - 'A'.charCodeAt(0) + 1,
            },
            top: border,
            bottom: border,
            left: border,
            right: border,
            innerHorizontal: border,
            innerVertical: border,
          },
        });

        curRow = curRow + orderVariant.colorVariants.length + 1;
      });
    });

    await this.googleApiService.spreadSheetValuesUpdate(latestFileId, data);
    await this.googleApiService.spreadSheetUpdate(latestFileId, sheetAction);

    return orderDetails;
  }

  private async setCurrentGoogleSheetFileId(): Promise<string> {
    this.logger.log('setCurrentGoogleSheetFileId');
    try {
      const fileId = await this.getLatestGoogleSheetId();
      this.orderFormConfig.latestSheetFileId = fileId;
      return fileId;
    } catch (error) {
      this.logger.log('Failed to lookup current google sheet file id');
      this.logger.log(error);
    }

    this.orderFormConfig.latestSheetFileId = undefined;
    return undefined;
  }

  private async getLatestGoogleSheetId(): Promise<string> {
    const childrenMetadata = [];
    const children = await this.googleApiService.getFolderChildren(this.orderFormConfig.orderFormFolderId, null);

    for (let i = 0; i < children.length; i++) {
      childrenMetadata.push(await this.googleApiService.getFileMetadata(children[i].id));
    }

    // const childrenMetadata = await Promise.all(children.map(async child => await this.googleApiService.getFileMetadata(child.id)));
    childrenMetadata.sort((lhs, rhs) => Number(lhs.title.substr(-6)) - Number(rhs.title.substr(-6)));

    return childrenMetadata.pop().id;
  }

  private sendLogiwaReceipt(productOrders: ProductOrder[]): void {
    const orderMap = productOrders.reduce((acc, cur) => {
      const supplierCode = cur.brand ? cur.brand.brandCode : cur.vendor.vendorCode;
      return acc.set(supplierCode, [...(acc.get(supplierCode) || []), cur]);
    }, new Map<string, ProductOrder[]>());

    const receiptPromises = Array.from(orderMap, async ([supplierCode, orders]) => {
      const supplier = orders[0].brand
        ? (await this.brandsService.findOne(supplierCode)).brandName
        : (await this.vendorsService.findOne(supplierCode)).vendorName;

      return new ReceiptDto(
        orders[0].orderDate + orders[0].orderTime,
        orders[0].orderSeq,
        supplier,
        orders.map((order) => new ReceiptDetailDto(order.inventory.stdSku, order.orderQty)),
      );
    });

    Promise.all(receiptPromises).then((receipts: ReceiptDto[]) => {
      this.logiwaService.warehouseReceiptBulkInsert(receipts).then((response) => {
        console.log(response);
      });
    });
  }

  private async getOrderVariantsFromProductOrders(productOrders: ProductOrder[]) {
    const ordersByProductMap = productOrders.reduce(
      (acc, cur) => acc.set(cur.product.productCode, [...(acc.get(cur.product.productCode) || []), cur]),
      new Map<string, ProductOrder[]>(),
    );

    const productCodes = [...ordersByProductMap.keys()];
    const orderVariants = productCodes.map(async (productCode) => {
      const ordersByProduct = ordersByProductMap.get(productCode);
      const product = await this.productsService.findOne(productCode, false);
      const maunfacturingMaps = await this.manufacturingMapsService.find(productCode);

      const productVariants = await this.productMapsService.findMappingProducts(productCode);
      const sizeVariants = productVariants
        .sort((v1, v2) => v1.sizeOrder - v2.sizeOrder)
        .map((variant) => variant.shortSizeCode)
        .filter((variant, i, variants) => variants.indexOf(variant) === i);
      const colorVariants = [...new Set(productVariants.map((variant) => variant.productColor)).keys()];
      const variantMatrix = colorVariants.map((color) =>
        sizeVariants.map(
          (size) =>
            productVariants.find((variant) => variant.shortSizeCode === size && variant.productColor === color)?.stdSku,
        ),
      );
      const orderVariantTable = colorVariants.map((_, i) =>
        sizeVariants.map(
          (__, j) =>
            (
              ordersByProduct.find((productOrder) => productOrder.inventory.stdSku === variantMatrix[i][j]) || {
                orderQty: 0,
              }
            ).orderQty,
        ),
      );
      const manufacturingColorVariants = colorVariants.map(
        (color, i) =>
          (
            maunfacturingMaps.find((manufacturingMap) =>
              variantMatrix[i].some((stdSku) => manufacturingMap.inventory.stdSku === stdSku),
            ) || { manufacturingColor: color }
          ).manufacturingColor || color,
      );
      const sumByColor = orderVariantTable.map((row) => row.reduce((acc, cur) => acc + cur, 0));

      return {
        product,
        manufacturingCode:
          (
            maunfacturingMaps.find(
              (manufacturingMap) => manufacturingMap.product.productCode === product.productCode,
            ) || { manufacturingCode: '' }
          ).manufacturingCode || product.productCode,
        manufacturingTitle:
          (
            maunfacturingMaps.find(
              (manufacturingMap) => manufacturingMap.product.productCode === product.productCode,
            ) || { manufacturingTitle: '' }
          ).manufacturingTitle || product.productTitle,
        manufacturingColorVariants: manufacturingColorVariants.filter((_, i) => sumByColor[i] > 0),
        colorVariants: colorVariants.filter((_, i) => sumByColor[i] > 0),
        sizeVariants,
        variantIndexTable: variantMatrix.filter((_, i) => sumByColor[i] > 0),
        orderVariantTable: orderVariantTable.filter((_, i) => sumByColor[i] > 0),
        totalQuantity: sumByColor.reduce((acc, cur) => acc + cur, 0),
      };
    });

    return await Promise.all(orderVariants);
  }

  private getBrandOrVendorCode(productOrder: ProductOrder): string {
    return productOrder.vendor ? productOrder.vendor.vendorCode : productOrder.brand.brandCode;
  }

  private async buildOrderDetailsFromProductOrders(productOrders: ProductOrder[]) {
    const ordersByVendorAndBrand = productOrders.reduce(
      (acc, cur) => acc.set(this.getBrandOrVendorCode(cur), [...(acc.get(this.getBrandOrVendorCode(cur)) || []), cur]),
      new Map<string, ProductOrder[]>(),
    );

    const user = await this.usersService.findOne(
      productOrders
        .filter((productOrder) => (productOrder.user || null) !== null)
        .map((productOrder) => productOrder.user)
        .pop().employeeId,
    );

    const orderSeq = productOrders[0].orderSeq;
    const orderDate = productOrders[0].orderDate;
    const orderTime = productOrders[0].orderTime;

    const orderDetails = await Promise.all(
      [...ordersByVendorAndBrand.keys()].map(async (code) => {
        const vendorProductOrders = ordersByVendorAndBrand.get(code);
        const vendorCode = productOrders.find((productOrder) =>
          productOrder.vendor ? productOrder.vendor.vendorCode === code : false,
        )?.vendor.vendorCode;
        const vendor = vendorCode ? await this.vendorsService.findOne(vendorCode) : undefined;
        const brandCode = productOrders.find((productOrder) =>
          productOrder.vendor ? false : productOrder.brand.brandCode === code,
        )?.brand.brandCode;
        const brand = brandCode ? await this.brandsService.findOne(brandCode) : undefined;

        const orderVariants = await this.getOrderVariantsFromProductOrders(vendorProductOrders);
        return {
          orderSeq,
          user,
          brand,
          vendor,
          orderVariants,
        };
      }),
    );

    return {
      orderSeq,
      orderDate,
      orderTime,
      orderDetails,
    };
  }

  private async sendOrderEmails(productOrders: ProductOrder[]) {
    const orderDetail = await this.buildOrderDetailsFromProductOrders(productOrders);

    const curDttm = getCurrentDttm();
    const yyyy = curDttm.substring(0, 4);
    const mm = curDttm.substring(4, 6);
    const dd = curDttm.substring(6, 8);

    const messages = await Promise.all(
      orderDetail.orderDetails.map(async (vendorOrder) => {
        const html = this.getHtml(vendorOrder.orderVariants);
        // const htmlFileName = `${(vendorOrder.vendor?.vendorCode || vendorOrder.brand.brandCode)}_${curDttm}_order.html`;
        // writeFileSync(htmlFileName, html);

        const pdfFileName = `${vendorOrder.vendor?.vendorCode || vendorOrder.brand.brandCode}_${curDttm}_order.pdf`;
        const buffer = await this.createPDFFile(html, pdfFileName);
        // writeFileSync(pdfFileName, buffer);

        const receiver = {
          code: vendorOrder.vendor ? vendorOrder.vendor.vendorCode : vendorOrder.brand.brandCode,
          name: vendorOrder.vendor ? vendorOrder.vendor.vendorName : vendorOrder.brand.brandName,
          email: vendorOrder.vendor ? vendorOrder.vendor.vendorEmail : vendorOrder.brand.email,
          ordersFrom: (vendorOrder.vendor || vendorOrder.brand).ordersFrom,
        };

        const base64Encorded = buffer.toString('base64');
        const ordersFrom = receiver.ordersFrom || 'JC Sky, Inc (Hat and Beyond)';
        const employeeName = vendorOrder.user
          ? `${vendorOrder.user.firstName} ${vendorOrder.user.lastName}`
          : ordersFrom;
        const orderSeq = ('0000000000' + vendorOrder.orderSeq).slice(-10);

        // receiver.email = "jungbomp@hatandbeyond.com";

        return {
          to: receiver.email.split(' ').map((addr: string) => ({ email: addr, name: receiver.name })),
          cc: [
            { email: 'jcsky.jaik@gmail.com', name: 'Jai' },
            { email: 'jcsky.louis@gmail.com', name: 'Louis' },
            { email: 'jcsky.acct@gmail.com', name: 'Accounting' },
            { email: 'jungbom@hatandbeyond.com', name: 'Dev' },
            { email: 'jcsky.tedk@gmail.com', name: 'Ted' },
            { email: 'angelinal@hatandbeyond.com', name: 'Angelina' },
          ],
          from: { email: this.orderFormConfig.defaultSenderEmailAddress, name: this.orderFormConfig.defaultSenderName },
          subject: `${mm}/${dd}/${yyyy} ${ordersFrom} ORDER - Order ${orderSeq}`,
          text: 'Hello world',
          html: `<div>
                <div><span>Dear ${receiver.name},</span></div>
                <div><br /><div>
                <div><span>Please find the attachment and note that the unit used for all orders is single piece - e.g. 10 = 10 pcs.</span></div>
                <div><br /></div>
                <div><span>Order #${orderSeq}</span></div>
                <div><br /></div>
                <div><span>Best,</span></div>
                <div><span>${employeeName} ${ordersFrom}
              </div>`,
          attachments: [
            {
              content: base64Encorded,
              filename: `${ordersFrom}_${receiver.name}_${orderSeq} ${mm}-${dd}-${yyyy}.pdf`,
            },
          ],
        };
      }),
    );

    return await this.sendGridService.sendEmails(messages);
  }

  private getHtml(orderVariants): string {
    const contents = readFileSync(`${process.env.PWD}/src/views/orderDetail.ejs`, 'utf8');
    const html = render(contents, { orderVariants });

    return html;
  }

  private async createPDFFile(htmlString: string, fileName: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);
    await page.setContent(htmlString, { waitUntil: 'networkidle0' });
    await page.addStyleTag({
      content: `
        body { margin-top: 0; }
        @page:first { margin-top: 0 }
      `,
    });

    const buffer = await page.pdf({
      // format: 'Letter',
      landscape: true,
      path: fileName,
      margin: { left: 0, top: 0, right: 0, bottom: 0 },
      preferCSSPageSize: true,
      // header: {
      //   eight: '15mm',
      //   contents: `<img alt=’Clintek logo’
      //                       height=’100'
      //                       width=’100'
      //                       src=’http://52.207.115.173:9191/files/5a6597eb7a67600c64ce52cf/?api_key=25BDD8EC59070421FDDE3C571182F6F12F5AAF99FF821A285884E979F3783B23'>`
      // },
      // timeout: 600000,
      // footer: {
      //   height: '15mm',
      //   contents: {
      //     first: `<div>
      //                 <span>1</span>
      //               </div>`,
      //     2: `<div>
      //               <span>2</span>
      //         </div>`,  // Any page number is working. 1-based index
      //     3: `<div>
      //               <span>3</span>
      //           </div>`,
      //     4: `<div>
      //             <span>4</span>
      //         </div>`,
      //     5: `<div>
      //             <span>6</span>
      //           </div>`,
      //     6: `<div>
      //             <span>7</span>
      //           </div>`,
      //     default: `<div>
      //                       <span>Appointment Report</span>
      //                 </div>`, // fallback value
      //     last: `<div>
      //                     <span>Last Page</span>
      //             </div>`,
      //   }
      // }
    });
    await browser.close();

    return buffer;
  }
}

interface OrderFormConfig {
  defaultSenderEmailAddress: string;
  defaultSenderName: string;
  orderFormFolderId: string;
  latestSheetFileId: string;
}
