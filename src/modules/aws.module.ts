import { Module } from '@nestjs/common';
import { AWSController } from 'src/controllers/aws.controller';
import { AWSService } from 'src/services/aws.service';

@Module({
    providers: [AWSService],
    controllers: [AWSController],
    exports: [AWSService]
  })
  export class AWSModule {}
  