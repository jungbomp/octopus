import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ListingsService } from 'src/services/listings.service';
import { Listing } from 'src/models/listing.entity';
import { CreateListingDto } from 'src/models/dto/createListing.dto';
import { LogiwaItemChannelListingSearchDto } from 'src/models/dto/logiwaItemChannelListingSearch.dto';
import { toDateFromDateString } from 'src/utils/dateTime.util';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(): Promise<Listing[]> {
    return this.listingsService.findAll();
  }

  @Get(':stdSku')
  findByInventory(@Param('stdSku') stdSku: string): Promise<Listing[]> {
    return this.listingsService.findByInventory(stdSku);
  }

  @Get(':listingItemId/:marketId/:listingSku')
  findOne(@Param('listingItemId') listingItemId: string, @Param('marketId') marketId: string, @Param('listingSku') listingSku: string): Promise<Listing> {
    return this.listingsService.findOne(listingItemId, Number(marketId), listingSku);
  }

  @Post()
  create(@Body() createListingDto: CreateListingDto): Promise<Listing> {
    return this.listingsService.create(createListingDto);
  }

  @Delete(':stdSku')
  remove(@Param('listingItemId') listingItemId: string, @Param('marketId') marketId: string): Promise<void> {
    return this.listingsService.remove(listingItemId, Number(marketId));
  }

  @Post('load-channel-listing-items-from-logiwa')
  loadListingDataFromLogiwa(@Body() logiwaItemChannelListingSearchDto: LogiwaItemChannelListingSearchDto): Promise<any> {
    return this.listingsService.loadListingDataFromLogiwa(logiwaItemChannelListingSearchDto);
  }

  @Post('update-listing-quantity')
  updateQuantityToChannel(@Query('startDate') startDate: string, @Query('endDate') endDate: string): Promise<void> {
    const from = toDateFromDateString(startDate);
    const to = toDateFromDateString(endDate);
    return this.listingsService.updateQuantityToChannel(from, to);
  }

  @Post('update-all-available-listing-quantity')
  updateAllQuantityToChannel(): Promise<void> {
    return this.listingsService.updateAllAvailableQuantityToChannel();
  }
}
