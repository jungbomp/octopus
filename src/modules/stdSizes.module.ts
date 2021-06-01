import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StdSize } from '../models/stdSize.entity';
import { StdSizesController } from '../controllers/stdSizes.controller';
import { StdSizesService } from '../services/stdSizes.service';

@Module({
  imports: [TypeOrmModule.forFeature([StdSize])],
  providers: [StdSizesService],
  exports: [StdSizesService],
  controllers: [StdSizesController],
})
export class StdSizesModule {}
