import { Inventory } from '../inventory.entity';
import { InterchangeableGroup } from '../interchangeableGroup.entity'

export class CreateInterchangeableGroupDto {
  stdSku: string;
  quantity: number;

  static toInterchangeableGroup(dto: CreateInterchangeableGroupDto, inventory: Inventory): InterchangeableGroup {
    const interchangeableGroup = new InterchangeableGroup();
    interchangeableGroup.inventory = inventory;
    interchangeableGroup.quantity = dto.quantity;
    
    return interchangeableGroup;
  }
}