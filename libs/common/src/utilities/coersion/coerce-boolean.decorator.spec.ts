import { TransformFnParams } from 'class-transformer';
import { TransformMetadata } from 'class-transformer/types/interfaces/metadata/transform-metadata.interface';
import { CoerceBoolean } from './coerce-boolean.decorator';

let capturedTransformFn: TransformMetadata['transformFn'] | undefined;

jest.mock('class-transformer', () => ({
  Transform: (fn: any) => {
    capturedTransformFn = fn
  }
}));

describe('CoerceBoolean', () => {

  function classEvaluator() {
    class MyClass {
      @CoerceBoolean()
      property: boolean;
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
    capturedTransformFn = undefined;
  });

  it('should call Transform decorator with the transform function and options', () => {
    // Given
    const mockModule = jest.requireMock('class-transformer');
    const transformerSpy = jest.spyOn(mockModule, 'Transform');

    // When
    const klass = classEvaluator();

    // Then
    expect(klass).toBeTruthy();
    expect(capturedTransformFn).toBeTruthy();
    expect(transformerSpy).toHaveBeenCalledWith(capturedTransformFn, { toClassOnly: true });
  });

  it('should properly coerce boolean value based on the provided raw input', () => {
    // Given
    const klass = classEvaluator();
    const transformFn = capturedTransformFn!;
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
      let value = transformFn(getMockParamsForInput(input));

      // Then
      expect(value).toBe(expectVal);
    }));
  });

});
