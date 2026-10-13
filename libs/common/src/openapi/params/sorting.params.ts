import { CoerceBoolean } from '../../index.js';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { SortingParams as SortingParamsObject } from '../../index.js';

/**
 * Query params DTO for sorting without validation of the `sortBy` field.
 */
export class SortingParams implements SortingParamsObject {

  @ApiPropertyOptional({
    description: 'Field or path by which the data should be sorted'
  })
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
