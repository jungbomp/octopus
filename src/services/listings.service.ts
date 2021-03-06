import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmazonSPApiService } from './amazonSPApi.service';
import { EbayApiService } from './ebayApi.service';
import { InterchangeableGroupsService } from './interchangeableGroups.service';
import { InventoriesService } from './inventories.service';
import { OrdersService } from './orders.service';
import { LogiwaService } from './logiwa.service';
import { MarketsService } from './markets.service';
import { WalmartApiService } from './walmartApi.service';
import { AmazonSPApiUpdateListingsItemQuantityRequest } from '../models/amazonSP/amazonSPApiUpdateListingsItemQuantityRequest';
import { CreateListingDto } from '../models/dto/createListing.dto';
import { EbayApiBulkUpdatePriceQuantityDto } from '../models/dto/ebayApiBulkUpdatePriceQuantity.dto';
import { LogiwaItemChannelListingSearchDto } from '../models/dto/logiwaItemChannelListingSearch.dto';
import { WalmartApiUpdateInventoryDto } from '../models/dto/wamartApiUpdateInventory.dto';
import { InterchangeableGroup } from '../models/interchangeableGroup.entity';
import { InterchangeableGroupMap } from '../models/interchangeableGroupMap.entity';
import { Inventory } from '../models/inventory.entity';
import { Listing } from '../models/listing.entity';
import { Market } from '../models/market.entity';
import { Orders } from '../models/orders.entity';

import { getCurrentDttm, getDttmFromDate } from '../utils/dateTime.util';
import { findMarketId, findStoreType, toChannelTypeFromMarketId, toStoreTypeFromMarketId } from '../utils/types.util';
import { ChannelType, StoreType } from '../types';
import { OrderItem } from 'src/models/orderItem.entity';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    @InjectRepository(Listing)
    private readonly listingsRepository: Repository<Listing>,
    private readonly amazonSPApiService: AmazonSPApiService,
    private readonly ebayApiService: EbayApiService,
    private readonly interchangeableGroupsService: InterchangeableGroupsService,
    private readonly inventoiesService: InventoriesService,
    private readonly ordersService: OrdersService,
    private readonly logiwaService: LogiwaService,
    private readonly marketsService: MarketsService,
    private readonly walmartApiService: WalmartApiService,
  ) {}

  async create(createListingDto: CreateListingDto): Promise<Listing> {
    const market = await this.marketsService.findOne(createListingDto.marketId);
    const inventory = createListingDto.stdSku
      ? await this.inventoiesService.findOne(createListingDto.stdSku)
      : undefined;
    const listing = CreateListingDto.toListingEntity(createListingDto, market, inventory);

    return await this.listingsRepository.save(listing);
  }

  async createBatch(createListings: CreateListingDto[]): Promise<Listing[]> {
    const listings: Listing[] = createListings.map((dto: CreateListingDto): Listing => {
      const market = new Market();
      market.marketId = dto.marketId;

      const inventory = new Inventory();
      inventory.stdSku = dto.stdSku;

      return CreateListingDto.toListingEntity(
        dto,
        dto.marketId ? market : undefined,
        dto.stdSku ? inventory : undefined,
      );
    });

    return this.listingsRepository.save(listings);
  }

  async findAll(): Promise<Listing[]> {
    return this.listingsRepository.find();
  }

  async findOne(listingItemId: string, marketId: number, listingSku: string): Promise<Listing> {
    const option = {
      listingItemId,
      market: { marketId },
      listingSku,
    };

    return this.listingsRepository.findOne(option);
  }

  async findByInventory(stdSku: string): Promise<Listing[]> {
    const option = {
      inventory: {
        stdSku,
      },
    };

    return this.listingsRepository.find(option);
  }

  async remove(listingItemId: string, marketId: number): Promise<void> {
    const option = {
      listingItemId: listingItemId,
      market: { marketId },
    };

    await this.listingsRepository.delete(option);
  }

  async loadListingDataFromLogiwa(logiwaItemChannelListingSearchDto: LogiwaItemChannelListingSearchDto): Promise<void> {
    this.logger.log('Load channel listing items from logiwa');
    this.logger.log(logiwaItemChannelListingSearchDto);

    const channelId = logiwaItemChannelListingSearchDto.channelId;

    const markets: Market[] = await this.marketsService
      .findAll()
      .then((marketsList: Market[]): Market[] =>
        marketsList.filter(
          (market: Market, i: number): boolean =>
            marketsList.findIndex((m: Market): boolean => m.channelId === market.channelId) === i,
        ),
      );

    for (let i = 0; i < markets.length; i++) {
      const market: Market = markets[i];

      if (channelId && market.channelId !== Number(channelId)) {
        continue;
      }

      logiwaItemChannelListingSearchDto.selectedPageIndex = 1;
      logiwaItemChannelListingSearchDto.channelId = market.channelId;

      while (true) {
        const { Data: logiwaListings } = await this.logiwaService.inventoryItemItemChannelIDsSearch(
          logiwaItemChannelListingSearchDto,
        );

        if ((logiwaListings ?? []).length < 1) {
          break;
        }

        const createListings: CreateListingDto[] = [];
        for (let j = 0; i < logiwaListings.length; j++) {
          const logiwaListing = logiwaListings[j];

          const stdSku: string = await this.logiwaService.getLogiwaInventoryItemCode(logiwaListing.InventoryItemID);
          const channel: ChannelType = toChannelTypeFromMarketId(market.marketId);
          const store: StoreType = findStoreType(logiwaListing.StoreName);

          const createListingDto = new CreateListingDto();
          createListingDto.listingItemId = logiwaListing.ChannelItemNumber.toUpperCase();
          createListingDto.marketId = findMarketId(channel, store);
          createListingDto.stdSku = stdSku?.toUpperCase();
          createListingDto.listingSku = logiwaListing.SellerSKU.toUpperCase();
          createListingDto.listingItemName = logiwaListing.ItemDescription;
          createListingDto.listingItemQuantity = logiwaListing.InventoryAmount;
          createListingDto.listingItemPrice = logiwaListing.UnitPrice;
          createListingDto.isActive = 'Y';
          createListingDto.createdDttm = getCurrentDttm();
          createListingDto.lastModifiedDttm = createListingDto.createdDttm;

          createListings.push(createListingDto);
        }

        try {
          const listings = await this.createBatch(createListings);

          this.logger.log(
            `Load ${market.channelName} ${logiwaItemChannelListingSearchDto.selectedPageIndex}/${logiwaListings[0].PageCount} with ${listings.length} item records`,
          );
        } catch (error) {
          this.logger.log(
            `Failed to add listing ${market.channelName} ${logiwaItemChannelListingSearchDto.selectedPageIndex}/${logiwaListings[0].PageCount} item records`,
          );
        }

        if (logiwaItemChannelListingSearchDto.selectedPageIndex === logiwaListings[0].PageCount) {
          break;
        }

        logiwaItemChannelListingSearchDto.selectedPageIndex = logiwaItemChannelListingSearchDto.selectedPageIndex + 1;
      }
    }

    this.logger.log('Completed to load logiwa channel Items');
  }

  async updateQuantityToChannelByOrderDate(dateStart: Date, dateEnd: Date): Promise<void> {
    this.logger.log('Update tracking info to each channel between');
    this.logger.log(`${dateStart} and ${dateEnd}`);

    const orders: Orders[] = await this.ordersService.findByLastModifiedDate(
      getDttmFromDate(dateStart),
      getDttmFromDate(dateEnd),
    );

    return this.updateQuantityToChannelForOrdered(orders);
  }

  async updateQuantityToChannelForOrdered(orders: Orders[]): Promise<void> {
    this.logger.log('Update quantity to each channel for order items');

    this.logger.log('Retrieve orders for target stdSku list');
    const inventories: Inventory[] = orders
      .map((order: Orders): Inventory[] =>
        order.orderItems.map((orderItem: OrderItem): Inventory => orderItem.inventory),
      )
      .flat(1);

    const distinctInventories: Inventory[] = inventories.filter(
      (inventory: Inventory, i: number) =>
        inventories.findIndex((inven: Inventory) => inventory.stdSku === inven.stdSku) === i,
    );

    this.logger.log('Retrieve all interchangeable groups for ');
    const interchangeableGroupMaps: InterchangeableGroupMap[] =
      await this.interchangeableGroupsService.findAllMappings();
    const interchangeableQtyMap: Map<string, InterchangeableGroup> = interchangeableGroupMaps.reduce(
      (
        map: Map<string, InterchangeableGroup>,
        interchangeableGroupMap: InterchangeableGroupMap,
      ): Map<string, InterchangeableGroup> =>
        map.set(interchangeableGroupMap.inventory.stdSku, interchangeableGroupMap.interchangeableGroup),
      new Map<string, InterchangeableGroup>(),
    );

    const skuQuantityMap: Map<string, number> = distinctInventories.reduce(
      (map: Map<string, number>, inventory: Inventory): Map<string, number> =>
        map.set(
          inventory.stdSku,
          Math.max(inventory.productQty, interchangeableQtyMap.get(inventory.stdSku)?.quantity ?? 0),
        ),
      new Map<string, number>(),
    );

    this.logger.log(`Loaded ${skuQuantityMap.size} ordered stdSku from logiwa`);

    await this.updateStdSkuQuantityToEachChannel(skuQuantityMap);

    this.logger.log('Completed to update channel quantity');
  }

  async updateAllAvailableQuantityToChannel(): Promise<void> {
    this.logger.log('Update all available quantity to each channel');

    this.logger.log('Build interchangeable quantity map');
    const interchangeableGroupMaps: InterchangeableGroupMap[] =
      await this.interchangeableGroupsService.findAllMappings();
    const interchangeableQtyMap: Map<string, InterchangeableGroup> = interchangeableGroupMaps.reduce(
      (
        map: Map<string, InterchangeableGroup>,
        interchangeableGroupMap: InterchangeableGroupMap,
      ): Map<string, InterchangeableGroup> =>
        map.set(interchangeableGroupMap.inventory.stdSku, interchangeableGroupMap.interchangeableGroup),
      new Map<string, InterchangeableGroup>(),
    );

    const availableReportList = await this.logiwaService.getAllAvailableToPromiseReportList();

    this.logger.log('Retrieve inventories for availableReports');
    const inventories: Inventory[] = await Promise.all(
      availableReportList.map(
        (availableReport: any): Promise<Inventory> => this.inventoiesService.findOne(availableReport.Code),
      ),
    );

    const availableStockInfoMap: Map<string, number> = inventories
      .filter((inventory: Inventory) => inventory !== undefined)
      .reduce(
        (acc: Map<string, number>, inventory: Inventory): Map<string, number> =>
          acc.set(
            inventory.stdSku,
            Math.max(inventory.productQty, interchangeableQtyMap.get(inventory.stdSku)?.quantity ?? 0),
          ),
        new Map<string, number>(),
      );

    await this.updateStdSkuQuantityToEachChannel(availableStockInfoMap);

    this.logger.log('Completed to update all channels quantity');
  }

  private async updateStdSkuQuantityToEachChannel(availableSkuQuantityMap: Map<string, number>): Promise<void> {
    const habAmazonSPApiUpdateListingsItemQuantityRequests: AmazonSPApiUpdateListingsItemQuantityRequest[] = [];
    const maAmazonSPApiUpdateListingsItemQuantityRequests: AmazonSPApiUpdateListingsItemQuantityRequest[] = [];
    const habWalmartApiUpdateInventories: WalmartApiUpdateInventoryDto[] = [];
    const maWalmartApiUpdateInventories: WalmartApiUpdateInventoryDto[] = [];
    const habEbayApiBulkUpdatePriceQuantityDtos: EbayApiBulkUpdatePriceQuantityDto[] = [];
    const maEbayApiBulkUpdatePriceQuantityDtos: EbayApiBulkUpdatePriceQuantityDto[] = [];

    const availableStdSkus: string[] = [...availableSkuQuantityMap.keys()];
    this.logger.log('Look up listingd and inventories for each available stdSku');
    const listingsList: Listing[][] = await Promise.all(
      availableStdSkus.map(async (stdSku: string): Promise<Listing[]> => await this.findByInventory(stdSku)),
    );

    this.logger.log('Create DTO list for requesting each channel and inventory');
    availableStdSkus.forEach((stdSku: string, i: number) => {
      const quantity = availableSkuQuantityMap.get(stdSku);

      const listings: Listing[] = listingsList[i];
      listings.forEach((listing: Listing) => {
        const channel: ChannelType = toChannelTypeFromMarketId(listing.market.marketId);
        const store: StoreType = toStoreTypeFromMarketId(listing.market.marketId);

        switch (channel) {
          case ChannelType.AMAZON:
            if (store === StoreType.HAB) {
              habAmazonSPApiUpdateListingsItemQuantityRequests.push({ sku: listing.listingSku, quantity });
            } else {
              maAmazonSPApiUpdateListingsItemQuantityRequests.push({ sku: listing.listingSku, quantity });
            }
            break;

          case ChannelType.WALMART:
            if (store === StoreType.HAB) {
              habWalmartApiUpdateInventories.push({ sku: listing.listingItemId, amount: quantity });
            } else {
              maWalmartApiUpdateInventories.push({ sku: listing.listingItemId, amount: quantity });
            }
            break;

          case ChannelType.EBAY:
            if (store === StoreType.HAB) {
              habEbayApiBulkUpdatePriceQuantityDtos.push({ sku: listing.listingItemId, quantity });
            } else {
              maEbayApiBulkUpdatePriceQuantityDtos.push({ sku: listing.listingItemId, quantity });
            }

          default:
            break;
        }
      });
    });

    if (habAmazonSPApiUpdateListingsItemQuantityRequests.length > 0) {
      this.logger.log(
        `Updating ${ChannelType.AMAZON} ${StoreType.HAB} ${habAmazonSPApiUpdateListingsItemQuantityRequests.length} items quantity`,
      );
      await this.amazonSPApiService.updateListingsItemQuantity(
        StoreType.HAB,
        habAmazonSPApiUpdateListingsItemQuantityRequests,
      );
    }

    if (maAmazonSPApiUpdateListingsItemQuantityRequests.length > 0) {
      this.logger.log(
        `Updating ${ChannelType.AMAZON} ${StoreType.MA} ${maAmazonSPApiUpdateListingsItemQuantityRequests.length} items quantity`,
      );
      await this.amazonSPApiService.updateListingsItemQuantity(
        StoreType.MA,
        maAmazonSPApiUpdateListingsItemQuantityRequests,
      );
    }

    if (habWalmartApiUpdateInventories.length > 0) {
      this.logger.log(
        `Updating ${ChannelType.WALMART} ${StoreType.HAB} ${habWalmartApiUpdateInventories.length} items quantity`,
      );
      await this.walmartApiService.bulkItemInventoryUpdate(StoreType.HAB, habWalmartApiUpdateInventories);
    }

    if (maWalmartApiUpdateInventories.length > 0) {
      this.logger.log(
        `Updating ${ChannelType.WALMART} ${StoreType.MA} ${maWalmartApiUpdateInventories.length} items quantity`,
      );
      await this.walmartApiService.bulkItemInventoryUpdate(StoreType.MA, maWalmartApiUpdateInventories);
    }

    if (habEbayApiBulkUpdatePriceQuantityDtos.length > 0) {
      this.logger.log(
        `Updating ${habEbayApiBulkUpdatePriceQuantityDtos.length} inventory items into ${ChannelType.EBAY} ${StoreType.HAB}`,
      );
      const processed: number = await this.ebayApiService.bulkUpdatePriceQuantity(
        StoreType.HAB,
        habEbayApiBulkUpdatePriceQuantityDtos,
      );
      this.logger.log(
        `Updated ${processed}/${habEbayApiBulkUpdatePriceQuantityDtos.length} inventory items into ebay ${StoreType.HAB}`,
      );
    }

    if (maEbayApiBulkUpdatePriceQuantityDtos.length > 0) {
      this.logger.log(
        `Updating ${maEbayApiBulkUpdatePriceQuantityDtos.length} inventory items into ${ChannelType.EBAY} ${StoreType.MA}`,
      );
      const processed: number = await this.ebayApiService.bulkUpdatePriceQuantity(
        StoreType.MA,
        maEbayApiBulkUpdatePriceQuantityDtos,
      );
      this.logger.log(
        `Updated ${processed}/${maEbayApiBulkUpdatePriceQuantityDtos.length} inventory items into ebay ${StoreType.MA}`,
      );
    }
  }
}
