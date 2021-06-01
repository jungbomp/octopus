import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductOrder } from '../models/productOrder.entity';
import { CreateProductOrderDto } from '../models/dto/createProductOrder.dto';
import { ProductOrdersService } from '../services/productOrders.service';

@Controller('product-order')
export class ProductOrdersController {
  constructor(private readonly productOrdersService: ProductOrdersService) {}

  @Get()
  findAll(@Query('stdSku') stdSku: string): Promise<ProductOrder[]> {
    return this.productOrdersService.findAll(stdSku);
  }

  @Get('order-details/:orderSeq')
  findOrderDetail(@Param('orderSeq') orderSeq: number): Promise<any> {
    return this.productOrdersService.getOrderDetail(orderSeq);
  }

  @Get('force-send-emails/:orderSeq')
  forceSendEmails(@Param('orderSeq') orderSeq: number): Promise<any> {
    return this.productOrdersService.forceSendOrderEmails(orderSeq);
  }

  @Get(':orderSeq')
  find(@Param('orderSeq') orderSeq: number, @Query('stdSku') stdSku: string): Promise<ProductOrder[]> {
    return this.productOrdersService.find(orderSeq, stdSku);
  }

  @Post()
  create(@Body() createProductOrderDto: CreateProductOrderDto): Promise<ProductOrder> {
    return this.productOrdersService.create(createProductOrderDto);
  }

  @Post('batch')
  createBatch(@Body() createProductOrderDtos: CreateProductOrderDto[]): Promise<ProductOrder[]> {
    return this.productOrdersService.createBatch(createProductOrderDtos);
  }

  @Post('export-to-google-sheet')
  exportToGoogleSheet(@Body() createProductOrderDtos: CreateProductOrderDto[]): Promise<any> {
    return this.productOrdersService.exportOrderDetailsToGoogleSheet(createProductOrderDtos);
  }
}
