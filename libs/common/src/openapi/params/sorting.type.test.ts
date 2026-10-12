import { SortingType } from '../index.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

class SomeEntity {
  name!: string;
  age!: number;
  birthDate!: Date;
}

describe('SortingType', () => {
  let swaggerModule: any;

  beforeEach(async () => {
    swaggerModule = await vi.importActual('../internal/swagger.js');
  })

  it('should pass the right options to ApiPropertyOptional decorator and expose sortOptions on class instance', () => {
    // Given
    const apiPropertySpy = vi.spyOn(swaggerModule, 'ApiPropertyOptional');

    // When
    const MySortingType = SortingType<SomeEntity>(['name', 'age'], {
      description: 'test'
    });
    const instance = new MySortingType();

    // Then
    expect(apiPropertySpy).toHaveBeenCalledWith({
      type: 'string',
      enum: ['name', 'age'],
      description: 'test'
    });
    expect(instance.sortOptions).toEqual(['name', 'age']);
  });

  // Should test what passed to IsEnum, but mocking IsEnum causes problems.

});
