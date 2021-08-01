import { Inventory } from '../inventory.entity';
import { InterchangeableGroupMap } from '../interchangeableGroupMap.entity'

export class CreateInterchangeableGroupMapDto {
  interchangeableKeySku: string;
  stdSku: string;

  static toInterchangeableGroupMap(interchangeableKey: Inventory, inventory: Inventory): InterchangeableGroupMap {
    const interchangeableGroupMap = new InterchangeableGroupMap();
    interchangeableGroupMap.interchangeableKey = interchangeableKey;
    interchangeableGroupMap.inventory = inventory;
    
    return interchangeableGroupMap;
  }
}