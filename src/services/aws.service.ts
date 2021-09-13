import {  Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AWSService {

  private readonly logger = new Logger(AWSService.name);

  constructor(
    private readonly configService: ConfigService,
  ) {
  }
}