import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBundlesController } from '../controllers/productBundles.controller';
import { ProductBundlesService } from '../services/productBundles.service';
import { ProductBundle } from '../models/productBundle.entity';
import { InterchangeableGroupsModule } from './interchangeableGroups.module';
import { InventoriesModule } from './inventories.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductBundle]), InterchangeableGroupsModule, InventoriesModule],
  providers: [ProductBundlesService],
  exports: [ProductBundlesService],
  controllers: [ProductBundlesController],
})
export class ProductBundlesModule {}
