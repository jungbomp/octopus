import { Market } from '../market.entity';

export class UpdateMarketDto {
  channelId: number;
  channelName: string;
  storeName: string;
  channelImagePath: string;

  static toMarketEntity(dto: UpdateMarketDto): Market {
    const market = new Market();
    market.channelName = dto.channelName;
    market.storeName = dto.storeName;
    market.channelId = dto.channelId;
    market.channelImagePath = dto.channelImagePath;

    return market;
  }
}