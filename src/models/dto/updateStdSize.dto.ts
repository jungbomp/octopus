import { StdSize } from '../stdSize.entity';

export class UpdateStdSizeDto {
  sizeName: string;
  shortSizeCode: string;
  category: string;
  sizeOrder: number;
  note: string;

  static toStdSizeEntity(dto: UpdateStdSizeDto): StdSize {
    const stdSize = new StdSize();
    stdSize.sizeName = dto.sizeName;
    stdSize.shortSizeCode = dto.shortSizeCode;
    stdSize.category = dto.category;
    stdSize.sizeOrder = dto.sizeOrder;
    stdSize.note = dto.note;

    return stdSize;
  }
}
