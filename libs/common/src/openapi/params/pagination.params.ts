import { Expose } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { PaginationParams as PaginationParamsObject } from '../../index.js';

/**
 * Query params DTO for simple pagination.
 */
export class PaginationParams implements PaginationParamsObject {

  @ApiPropertyOptional({
    description: 'Offset from the first matched entity'
  })
  @Expose()
  @Min(0)
  @IsOptional()
  readonly offset?: number;

  @ApiPropertyOptional({
    description: 'Page size'
  })
  @Expose()
  @IsPositive()
  @IsOptional()
  readonly limit?: number;

}
