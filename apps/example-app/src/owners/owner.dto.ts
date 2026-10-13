import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { TransformMongoId } from '../shared/app-schema.js';

export class OwnerDto {
  @ApiProperty()
  @Expose()
  @TransformMongoId()
  _id!: string;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty({ description: 'Number of live (not soft-deleted) cats' })
  @Expose()
  catsCount!: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}

export class CreateOwnerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class TransferCatsDto {
  @ApiProperty({ description: 'ID of the owner who takes over the cats' })
  @IsMongoId()
  toOwnerId!: string;
}

export class TransferCatsResultDto {
  @ApiProperty()
  moved!: number;
}
