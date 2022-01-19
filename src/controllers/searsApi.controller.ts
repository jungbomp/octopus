import { Controller, Get } from '@nestjs/common';
import { SearsApiService } from 'src/services/searsApi.service';

@Controller('sears-api')
export class SearsApiController {
  constructor(private readonly searsApiService: SearsApiService) {}

  @Get('shipping-carrier')
  getShippingCarrier(): Promise<any> {
    return this.searsApiService.getShippingCarrier();
  }
}
