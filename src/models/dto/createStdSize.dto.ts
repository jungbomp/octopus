import { StdSize } from '../stdSize.entity';

export class CreateStdSizeDto {
  sizeCode: string;
  sizeName: string;
  shortSizeCode: string;
  category: string;
  sizeOrder: number;
  note: string;

  static toStdSizeEntity(dto: CreateStdSizeDto): StdSize {
    const stdSize = new StdSize();
    stdSize.sizeCode = dto.sizeCode;
    stdSize.sizeName = dto.sizeName;
    stdSize.shortSizeCode = dto.shortSizeCode;
    stdSize.category = dto.category;
    stdSize.sizeOrder = dto.sizeOrder;
    stdSize.note = dto.note;

    return stdSize;
  }
}
