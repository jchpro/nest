import type { TransformFnParams } from 'class-transformer';
import type { TransformMetadata } from 'class-transformer/types/interfaces/metadata/transform-metadata.interface.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoerceBoolean } from './coerce-boolean.decorator.js';

const state = vi.hoisted(() => ({
  capturedTransformFn: undefined as TransformMetadata['transformFn'] | undefined,
}));

vi.mock('class-transformer', () => ({
  Transform: (fn: any) => {
    state.capturedTransformFn = fn;
  }
}));

describe('CoerceBoolean', () => {

  function classEvaluator() {
    class MyClass {
      @CoerceBoolean()
      property!: boolean;
    }
    return MyClass;
  }

  function getMockParamsForInput(rawInput: any): TransformFnParams {
    return {
      value: 'nope',
      type: 0,
      obj: {
        property: rawInput
      },
      key: 'property',
      options: {}
    };
  }

  beforeEach(() => {
    state.capturedTransformFn = undefined;
  });

  it('should call Transform decorator with the transform function and options', async () => {
    // Given
    const mockModule = await import('class-transformer');
    const transformerSpy = vi.spyOn(mockModule, 'Transform');

    // When
    const klass = classEvaluator();

    // Then
    expect(klass).toBeTruthy();
    expect(state.capturedTransformFn).toBeTruthy();
    expect(transformerSpy).toHaveBeenCalledWith(state.capturedTransformFn, { toClassOnly: true });
  });

  it('should properly coerce boolean value based on the provided raw input', () => {
    // Given
    classEvaluator();
    const transformFn = state.capturedTransformFn!;
    const inputsExpects: { input: any; expectVal: boolean }[] = [
      { input: '1',         expectVal: true },
      { input: '42',        expectVal: true },
      { input: '50.13',     expectVal: true },
      { input: 'true',      expectVal: true },
      { input: '0',         expectVal: false },
      { input: '-42',       expectVal: false },
      { input: '-50.13',    expectVal: false },
      { input: 'false',     expectVal: false },
      { input: 'nonsense',  expectVal: false },
      { input: 'Infinity',  expectVal: false },
      { input: '-Infinity', expectVal: false },
      { input: {},          expectVal: true },
      { input: 42,          expectVal: true },
      { input: null,        expectVal: false },
      { input: undefined,   expectVal: false },
    ];

    inputsExpects.forEach((({input, expectVal}) => {

      // When
      const value = transformFn(getMockParamsForInput(input));

      // Then
      expect(value).toBe(expectVal);
    }));
  });

});
