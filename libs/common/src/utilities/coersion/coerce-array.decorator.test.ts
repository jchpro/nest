import type { TransformFnParams } from 'class-transformer';
import type { TransformMetadata } from 'class-transformer/types/interfaces/metadata/transform-metadata.interface.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoerceArray } from './coerce-array.decorator.js';

const state = vi.hoisted(() => ({
  capturedTransformFn: undefined as TransformMetadata['transformFn'] | undefined,
}));

vi.mock('class-transformer', () => ({
  Transform: (fn: any) => {
    state.capturedTransformFn = fn;
  }
}));

describe('CoerceArray', () => {

  function classEvaluator() {
    class MyClass {
      @CoerceArray()
      property!: string[];
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

  it('should wrap a bare scalar value in an array', () => {
    // Given
    classEvaluator();
    const transformFn = state.capturedTransformFn!;

    // When
    const value = transformFn(getMockParamsForInput('abc'));

    // Then
    expect(value).toEqual(['abc']);
  });

  it('should leave an existing array untouched', () => {
    // Given
    classEvaluator();
    const transformFn = state.capturedTransformFn!;

    // When
    const value = transformFn(getMockParamsForInput(['abc', 'def']));

    // Then
    expect(value).toEqual(['abc', 'def']);
  });

  it.each([undefined, null])('should pass %s through unchanged', (input) => {
    // Given
    classEvaluator();
    const transformFn = state.capturedTransformFn!;

    // When
    const value = transformFn(getMockParamsForInput(input));

    // Then
    expect(value).toBe(input);
  });

});
