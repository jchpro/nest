import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsPositive } from 'class-validator';

export class CreateCatDto {

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  birthDate: Date;

  @ApiProperty()
  @IsPositive()
  @Expose()
  weightG: number;

}
