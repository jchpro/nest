import { MongoIdParamFactory } from '@jchpro/nest-mongoose';
import type { PipeTransform } from '@nestjs/common';

let paramArgs: any[] = [];

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    Param: (...args: any[]) => {
      paramArgs = args;
    },
  };
});

describe('MongoIdParamFactory', () => {
  let mockCommon: any;

  beforeEach(() => {
    paramArgs = [];
    mockCommon = jest.requireMock('@nestjs/common');
  });

  it('should return Param decorator with properly configured validation pipe class', () => {
    // Given
    class MyError {
      constructor(readonly gotError: any) {}
    }
    const paramSpy = jest.spyOn(mockCommon, 'Param');
    const MongoIdParam = MongoIdParamFactory((value) => new MyError(value));
    MongoIdParam('field');

    // Then
    expect(paramSpy).toHaveBeenCalledTimes(1);
    expect(paramArgs[0]).toEqual('field');
    const pipeClass: new () => PipeTransform = paramArgs[1];
    expect(pipeClass).toBeTruthy();

    // And when
    const evaluator = () => {
      const pipe = new pipeClass();
      pipe.transform('nonsense', {} as any);
    }

    // Then
    expect(evaluator).toThrow(MyError);
  });

});
