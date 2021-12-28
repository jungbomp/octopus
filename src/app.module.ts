import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from 'nest-router';

import { configuration } from './config';
import { ClockInModule } from './modules/clockIn.module';
import { MarketsModule } from './modules/markets.module';
import { UsersModule } from './modules/users.module';
import { BrandsModule } from './modules/brands.module';
import { VendorsModule } from './modules/vendors.module';
import { VendorMapsModule } from './modules/vendorMaps.module';
import { ProductsModule } from './modules/products.module';
import { ProductBundlesModule } from './modules/productBundles.module';
import { StdSizesModule } from './modules/stdSizes.module';
import { InventoriesModule } from './modules/inventories.module';
import { ProductMapsModule } from './modules/productMaps.module';
import { ManufacturingMapsModule } from './modules/manufacturingMaps.module';
import { ProductOrdersModule } from './modules/productOrders.module';
import { OrdersModule } from './modules/orders.module';
import { TasksModule } from './modules/tasks.module';
import { ListingsModule } from './modules/listings.module';
import { LogiwaApiModule } from './modules/logiwaApi.module';
import { WalmartApiModule } from './modules/walmartApi.module';
import { EbayApiModule } from './modules/ebayApi.module';
import { AmazonSPApiModule } from './modules/amazonSPApi.module';
import { InterchangeableGroupsModule } from './modules/interchangeableGroups.module';
import { AWSModule } from './modules/aws.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV || 'development'}`],
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        entities: [`${__dirname}/entity/**/*.{js,ts}`],
        subscribers: [`${__dirname}/entity/**/*.{js,ts}`],
        migrations: [`${__dirname}/migration/**/*.{js,ts}`],
        ...config.get('db'),
      }),
      inject: [ConfigService],
    }),
    RouterModule.forRoutes([
      {
        path: '/api/v1',
        children: [
          {
            path: '/',
            module: MarketsModule,
          },
          {
            path: '/',
            module: UsersModule,
          },
          {
            path: '/',
            module: ClockInModule,
          },
          {
            path: '/',
            module: BrandsModule,
          },
          {
            path: '/',
            module: VendorsModule,
          },
          {
            path: '/',
            module: VendorMapsModule,
          },
          {
            path: '/',
            module: ProductsModule,
          },
          {
            path: '/',
            module: StdSizesModule,
          },
          {
            path: '/',
            module: InventoriesModule,
          },
          {
            path: '/',
            module: ProductMapsModule,
          },
          {
            path: '/',
            module: ProductOrdersModule,
          },
          {
            path: '/',
            module: ManufacturingMapsModule,
          },
          {
            path: '/',
            module: OrdersModule,
          },
          {
            path: '/',
            module: ListingsModule,
          },
          {
            path: '/',
            module: WalmartApiModule,
          },
          {
            path: '/',
            module: LogiwaApiModule,
          },
          {
            path: '/',
            module: EbayApiModule,
          },
          {
            path: '/',
            module: AmazonSPApiModule,
          },
          {
            path: '/',
            module: InterchangeableGroupsModule,
          },
          {
            path: '/',
            module: AWSModule,
          },
          {
            path: '/',
            module: ProductBundlesModule,
          },
        ],
      },
    ]),
    MarketsModule,
    UsersModule,
    ClockInModule,
    BrandsModule,
    VendorsModule,
    VendorMapsModule,
    ProductsModule,
    ProductBundlesModule,
    StdSizesModule,
    InventoriesModule,
    ProductMapsModule,
    ProductOrdersModule,
    ManufacturingMapsModule,
    OrdersModule,
    TasksModule,
    ListingsModule,
    WalmartApiModule,
    LogiwaApiModule,
    EbayApiModule,
    AmazonSPApiModule,
    InterchangeableGroupsModule,
    AWSModule,
  ],
})
export class AppModule {}
