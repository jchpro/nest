import { PaginationParams, SortingType } from '@jchpro/nest-common/openapi';
import { FilterQueryProvider } from '@jchpro/nest-mongoose';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, MinLength } from 'class-validator';
import { escapeRegExp } from 'lodash';
import { Cat } from '../schemas/cat.schema';
import { FilterQuery } from 'mongoose';

export class CatQuery extends IntersectionType(
  PaginationParams,
  SortingType<Cat>([ 'name', 'created', 'updated', 'birthDate', 'weightG' ]),
) implements FilterQueryProvider<Cat> {

  @ApiPropertyOptional({ description: 'Filter by part of the name, minimum 2 characters' })
  @Expose()
  @IsOptional()
  @MinLength(2)
  readonly nameLike?: string;

  @ApiPropertyOptional({ description: 'Filter cats with minimum weight in grams' })
  @Expose()
  @IsOptional()
  readonly minWeightG?: number;

  @ApiPropertyOptional({ description: 'Filter cats with maximum weight in grams' })
  @Expose()
  @IsOptional()
  readonly maxWeightG?: number;

  getFilters(): FilterQuery<Cat> {
    const conditions: FilterQuery<Cat>[] = [];
    if (this.nameLike) {
      conditions.push({
        name: {
          $regex: escapeRegExp(this.nameLike),
          $options: 'i'
        }
      });
    }
    if (this.minWeightG) {
      conditions.push({
        weightG: { $gte: this.minWeightG }
      });
    }
    if (this.maxWeightG) {
      conditions.push({
        weightG: { $lte: this.maxWeightG }
      });
    }
    if (!conditions.length) {
      return {};
    }
    return { $and: conditions };
  }

}
