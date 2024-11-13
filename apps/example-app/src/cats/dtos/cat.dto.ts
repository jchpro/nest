import { ApiProperty } from '@nestjs/swagger';
import { CommonDto } from '../../core/dtos/common.dto';
import { Cat, CatDocument } from '../schemas/cat.schema';

export class CatDto implements CommonDto<Cat> {

  @ApiProperty()
  _id: string;

  @ApiProperty()
  created: Date;

  @ApiProperty()
  updated: Date;

  @ApiProperty()
  name: string;

  @ApiProperty()
  birthDate: Date;

  @ApiProperty()
  color: string;

  @ApiProperty()
  weightG: number;

  @ApiProperty()
  isCute: boolean;

  static default(cat: CatDocument): CatDto {
    return cat.toJSON();
  }

}
