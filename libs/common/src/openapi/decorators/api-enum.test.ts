import type { ApiEnum as ApiEnumType, ApiEnumOptional as ApiEnumOptionalType, reusableApiEnum as reusableApiEnumType } from '../index.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ApiEnum, ApiEnumOptional, reusableApiEnum', () => {
  let mockModule: any;
  let ApiEnum: typeof ApiEnumType;
  let ApiEnumOptional: typeof ApiEnumOptionalType;
  let reusableApiEnum: typeof reusableApiEnumType;
  enum Abc { A, B, C }

  beforeEach(async () => {
    // Fresh module instances per test: `reusableApiEnum` keeps registered enum names in
    // module-level state, and re-registering the same name is expected to throw.
    vi.resetModules();
    const ns = await import('../index.js');
    ApiEnum = ns.ApiEnum;
    ApiEnumOptional = ns.ApiEnumOptional;
    reusableApiEnum = ns.reusableApiEnum;
    mockModule = await import('../internal/swagger.js');
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
        field!: Abc;
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

  it('should call `ApiProperty` passing proper data for required enum', () => {
    // Given
    registerEnum();
    const apiPropertySpy = vi.spyOn(mockModule, 'ApiProperty');

    // When
    const classEvaluator = () => {
      class MyDto {
        @ApiEnum(Abc)
        field!: Abc;
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
  });

  it('should call `ApiProperty` passing proper data for optional enum, including extra property options', () => {
    // Given
    registerEnum();
    const apiPropertySpy = vi.spyOn(mockModule, 'ApiProperty');

    // When
    const classEvaluator = () => {
      class MyDto {
        @ApiEnumOptional(Abc, { isArray: true })
        field!: Abc[];
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
