import { Market } from '../market.entity';

export class CreateMarketDto {
  marketId: number;
  channelId: number;
  channelName: string;
  storeName: string;
  channelImagePath: string;

  static toMarketEntity(dto: CreateMarketDto): Market {
    const market = new Market();
    market.marketId = dto.marketId;
    market.channelName = dto.channelName;
    market.storeName = dto.storeName;
    market.channelId = dto.channelId;
    market.channelImagePath = dto.channelImagePath;

    return market;
  }
}
