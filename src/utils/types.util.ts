import { ChannelType, MarketType, StoreType } from 'src/types';

const marketTable = [
  {
    id: 0,
    channelId: 0,
    channel: null,
    store: null,
  },
  {
    id: MarketType.HAB_AMAZON,
    channelId: 1,
    channel: ChannelType.AMAZON,
    store: StoreType.HAB,
  },
  {
    id: MarketType.HAB_WALMART,
    channelId: 54,
    channel: ChannelType.WALMART,
    store: StoreType.HAB,
  },
  {
    id: MarketType.HAB_SHOPIFY,
    channelId: 3,
    channel: ChannelType.SHOPIFY,
    store: StoreType.HAB,
  },
  {
    id: MarketType.MA_AMAZON,
    channelId: 1,
    channel: ChannelType.AMAZON,
    store: StoreType.MA,
  },
  {
    id: MarketType.MA_EBAY,
    channelId: 2,
    channel: ChannelType.EBAY,
    store: StoreType.MA,
  },
  {
    id: MarketType.MA_WALMART,
    channelId: 54,
    channel: ChannelType.WALMART,
    store: StoreType.MA,
  },
  {
    id: MarketType.HAB_EBAY,
    channelId: 2,
    channel: ChannelType.EBAY,
    store: StoreType.HAB,
  },
  {
    id: MarketType.HAB_SEARS,
    channelId: 9,
    channel: ChannelType.SEARS,
    store: StoreType.HAB,
  },
];

export const toChannelTypeFromMarketId = (marketId: number): ChannelType => marketTable[marketId].channel;
export const toStoreTypeFromMarketId = (marketId: number): StoreType => marketTable[marketId].store;
export const findMarketId = (channel: ChannelType, store: StoreType): number =>
  marketTable.find((market) => market.channel === channel && market.store === store).id ?? -1;
export const findChannelTypeFromChannelId = (channelId: number): ChannelType =>
  marketTable.find((market) => market.channelId === channelId)?.channel;
export const findStoreType = (storeName: string): StoreType =>
  storeName.toLowerCase().indexOf(StoreType.HAB.toLowerCase()) > -1 || storeName.toLowerCase().indexOf('skyhigh') > -1
    ? StoreType.HAB
    : StoreType.MA;

export const findMarketIdFromString = (channelId: number, store: StoreType): number =>
  marketTable.find((market) => market.channelId === channelId && market.store === store)?.id ?? -1;

export const getChannelIds = (): number[] => [
  ...marketTable.reduce((set: Set<number>, market: any): Set<number> => set.add(market.channelId), new Set<number>()),
];
