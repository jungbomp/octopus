import { Inventory } from '../inventory.entity';
import { Listing } from '../listing.entity';
import { Market } from '../market.entity';

export class CreateListingDto {
  listingItemId: string;
  marketId: number;
  stdSku?: string;
  listingSku: string;
  listingItemName: string;
  listingItemQuantity: number;
  listingItemPrice: number;
  isActive: string;
  createdDttm: string;
  lastModifiedDttm: string;

  static toListingEntity(dto: CreateListingDto, market: Market, inventory?: Inventory): Listing {
    const listing = new Listing();
    listing.listingItemId = dto.listingItemId;
    listing.market = market;
    listing.inventory = inventory;
    listing.listingSku = dto.listingSku;
    listing.listingItemName = dto.listingItemName;
    listing.listingItemQuantity = dto.listingItemQuantity;
    listing.listingItemPrice = dto.listingItemPrice;
    listing.isActive = dto.isActive;
    listing.createdDttm = dto.createdDttm;
    listing.lastModifiedDttm = dto.lastModifiedDttm;

    return listing;
  }
}