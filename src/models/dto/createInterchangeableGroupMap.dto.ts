import { Inventory } from '../inventory.entity';
import { InterchangeableGroup } from '../interchangeableGroup.entity';
import { InterchangeableGroupMap } from '../interchangeableGroupMap.entity';

export class CreateInterchangeableGroupMapDto {
  interchangeableGroupStdSku: string;
  stdSku: string;

  static toInterchangeableGroupMap(interchangeableGroup: InterchangeableGroup, inventory: Inventory): InterchangeableGroupMap {
    const interchangeableGroupMap = new InterchangeableGroupMap();
    interchangeableGroupMap.interchangeableGroup = interchangeableGroup;
    interchangeableGroupMap.inventory = inventory;
    
    return interchangeableGroupMap;
  }
}