import { IsEnum, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';
import { SortingParams } from './sorting.params';
import type { SortingOptionsProvider } from '@jchpro/nest-common';
import { ApiPropertyOptional, ApiPropertyOptions, IntersectionType, OmitType } from '../internal/swagger';

/**
 * Return sorting params class with `sortBy` field typed with fields of a given model.
 */
export function SortingType<T>(sortByOptions: (keyof T | string)[],
                               options?: Omit<ApiPropertyOptions, 'type' | 'enum'>) {
  class TypedSortingParams implements SortingOptionsProvider {
    @ApiPropertyOptional({
      type: 'string',
      enum: sortByOptions,
      description: 'Field or path by which the data should be sorted',
      ...options
    })
    @Expose()
    @IsEnum(buildPseudoEnum(sortByOptions as string[]))
    @IsOptional()
    sortBy?: keyof T | string;

    readonly sortOptions = sortByOptions as string[];
  }
  return IntersectionType(
    OmitType(SortingParams, ['sortBy']),
    TypedSortingParams
  );
}

function buildPseudoEnum(fields: string[]): object {
  const enumObj: Record<any, any> = {};
  fields.forEach(field => {
    enumObj[field] = field;
  });
  return enumObj;
}
