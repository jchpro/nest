import { CoerceBoolean } from '@jchpro/nest-common';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '../internal/swagger';
import type { SortingParams as SortingParamsObject } from '@jchpro/nest-common';

/**
 * Query params DTO for sorting without validation of the `sortBy` field.
 */
export class SortingParams implements SortingParamsObject {

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  readonly sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort in descending order'
  })
  @IsOptional()
  @CoerceBoolean()
  @Expose()
  readonly sortDesc?: boolean;
}
