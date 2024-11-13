import { SortingType } from '@jchpro/nest-common/openapi';

class SomeEntity {
  name: string;
  age: number;
  birthDate: Date;
}

describe('SortingType', () => {
  let swaggerModule: any;

  beforeEach(() => {
    swaggerModule = jest.requireActual('../internal/swagger');
  })

  it('should pass the right options to ApiPropertyOptional decorator and expose sortOptions on class instance', () => {
    // Given
    const apiPropertySpy = jest.spyOn(swaggerModule, 'ApiPropertyOptional');

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
