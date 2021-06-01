import { ChannelType, StoreType } from "src/types";

const marketTable = [
  {
    id: 0,
    channelId: 0,
    channel: null,
    store: null
  },
  {
    id: 1,
    channelId: 1,
    channel: ChannelType.AMAZON,
    store: StoreType.HAB
  },
  {
    id: 2,
    channelId: 54,
    channel: ChannelType.WALMART,
    store: StoreType.HAB
  },
  {
    id: 3,
    channelId: 3,
    channel: ChannelType.SHOPIFY,
    store: StoreType.HAB
  },
  {
    id: 4,
    channelId: 1,
    channel: ChannelType.AMAZON,
    store: StoreType.MA
  },
  {
    id: 5,
    channelId: 2,
    channel: ChannelType.EBAY,
    store: StoreType.MA
  },
  {
    id: 6,
    channelId: 54,
    channel: ChannelType.WALMART,
    store: StoreType.MA
  },
  {
    id: 7,
    channelId: 2,
    channel: ChannelType.EBAY,
    store: StoreType.HAB
  },
  {
    id: 8,
    channelId: 9,
    channel: ChannelType.SEARS,
    store: StoreType.HAB
  }
]

export const toChannelTypeFromMarketId = (marketId: number): ChannelType => marketTable[marketId].channel;
export const toStoreTypeFromMarketId = (marketId: number): StoreType => marketTable[marketId].store;
export const findMarketId = (channel: ChannelType, store: StoreType): number => marketTable.find(market => market.channel === channel && market.store === store).id ?? -1;
export const findChannelTypeFromChannelId = (channelId: number): ChannelType => marketTable.find(market => market.channelId === channelId)?.channel;
export const findStoreType = (storeName: string): StoreType =>
  storeName.toLowerCase().indexOf(StoreType.HAB.toLowerCase()) > -1  || storeName.toLowerCase().indexOf('skyhigh') > -1 ? StoreType.HAB : StoreType.MA;

export const findMarketIdFromString = (channelId: number, store: StoreType): number => 
  marketTable.find(market => market.channelId === channelId && market.store === store)?.id ?? -1;

export const getChannelIds = (): number[] => [...marketTable.reduce((set: Set<number>, market: any): Set<number> => set.add(market.channelId), new Set<number>())];
