import { CoerceBoolean } from '@jchpro/nest-common';
import { ApiEnum, ApiEnumOptional, PaginationParams, SortingType } from '@jchpro/nest-common/openapi';
import { type FilterQueryProvider } from '@jchpro/nest-mongoose';
import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { type FilterQuery } from 'mongoose';
import { TransformMongoId } from '../shared/app-schema.js';
import { CatBreed } from './cat-breed.js';
import { type Cat } from './cat.schema.js';

export class CatDto {
  @ApiProperty()
  @Expose()
  @TransformMongoId()
  _id!: string;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiEnum(CatBreed)
  @Expose()
  breed!: CatBreed;

  @ApiProperty({ description: 'ID of the owner' })
  @Expose()
  @TransformMongoId()
  owner!: string;

  @ApiPropertyOptional({ description: 'Set when the cat is soft-deleted' })
  @Expose()
  deletedAt?: Date;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}

export class CreateCatDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiEnum(CatBreed)
  @IsEnum(CatBreed)
  breed!: CatBreed;

  @ApiProperty({ description: 'ID of the owner' })
  @IsMongoId()
  ownerId!: string;
}

export class UpdateCatDto extends PartialType(PickType(CreateCatDto, ['name', 'breed'])) {}

/**
 * Query of the cats list: pagination and sorting DTOs of the library plus the filters,
 * which `QueryService` reads through `getFilters()`.
 */
export class CatsQuery
  extends IntersectionType(PaginationParams, SortingType<Cat>(['name', 'breed', 'createdAt']))
  implements FilterQueryProvider<Cat>
{
  @ApiEnumOptional(CatBreed)
  @IsEnum(CatBreed)
  @IsOptional()
  breed?: CatBreed;

  @ApiPropertyOptional({ description: 'Only cats of this owner' })
  @IsMongoId()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'List only the soft-deleted cats instead of the live ones' })
  @CoerceBoolean()
  @IsBoolean()
  @IsOptional()
  deleted?: boolean;

  getFilters(): FilterQuery<Cat> {
    return {
      ...(this.breed && { breed: this.breed }),
      ...(this.ownerId && { owner: this.ownerId }),
    };
  }
}
