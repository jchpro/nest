import type { ApiEnum as ApiEnumType, ApiEnumOptional as ApiEnumOptionalType, reusableApiEnum as reusableApiEnumType } from '@jchpro/nest-common/openapi';

let appliedToProperty: string;

jest.mock('../internal/swagger', () => {
  return {
    ApiProperty: () => (target: any, name: string) => {
      appliedToProperty = name;
    },
  };
});

describe('ApiEnum, ApiEnumOptional, reusableApiEnum', () => {
  let mockModule: any;
  let ApiEnum: typeof ApiEnumType;
  let ApiEnumOptional: typeof ApiEnumOptionalType;
  let reusableApiEnum: typeof reusableApiEnumType;
  enum Abc { A, B, C }

  beforeEach(() => {
    (appliedToProperty as any) = undefined;
    jest.isolateModules(() => {
      const ns = require('@jchpro/nest-common/openapi');
      ApiEnum = ns.ApiEnum;
      ApiEnumOptional = ns.ApiEnumOptional;
      reusableApiEnum = ns.reusableApiEnum;
    });
    mockModule = jest.requireMock('../internal/swagger');
  });

  function registerEnum() {
    reusableApiEnum(Abc, 'MyEnum');
  }

  it('should fail applying enum decorator on enum which wasn\'t registered yet', () => {
    // Given enum not registered

    // When
    const classEvaluator = () => {
      class MyDto {
        @ApiEnum(Abc)
        field: Abc;
      }
      return MyDto;
    };

    // Then
    expect(classEvaluator).toThrow();
  });

  it('should fail registering enum with the same name second time', () => {
    // Given
    registerEnum();

    // Then
    expect(registerEnum).toThrow();
  });

  it('should call `ApiProperty` passing proper data for required enum and applying it to the right property', () => {
    // Given
    registerEnum();
    const apiPropertySpy = jest.spyOn(mockModule, 'ApiProperty');

    // When
    const classEvaluator = () => {
      class MyDto {
        @ApiEnum(Abc)
        field: Abc;
      }
      return MyDto;
    };
    classEvaluator();

    // Then
    expect(apiPropertySpy).toHaveBeenCalledWith({
      enum: Abc,
      enumName: 'MyEnum',
      required: true
    });
    expect(appliedToProperty).toBe('field');
  });

  it('should call `ApiProperty` passing proper data for optional enum, including extra property options', () => {
    // Given
    registerEnum();
    const apiPropertySpy = jest.spyOn(mockModule, 'ApiProperty');

    // When
    const classEvaluator = () => {
      class MyDto {
        @ApiEnumOptional(Abc, { isArray: true })
        field: Abc[];
      }
      return MyDto;
    };
    classEvaluator();

    // Then
    expect(apiPropertySpy).toHaveBeenCalledWith({
      enum: Abc,
      enumName: 'MyEnum',
      required: false,
      isArray: true
    });
  });

});
