import { MongoIdParamFactory } from '../index.js';
import { type PipeTransform } from '@nestjs/common';
import * as CommonModule from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nestjs/common', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof CommonModule>()),
  };
});

describe('MongoIdParamFactory', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return Param decorator with properly configured validation pipe class', () => {
    // Given
    class MyError {
      constructor(readonly gotError: any) {}
    }
    const paramSpy = vi.spyOn(CommonModule, 'Param');
    const MongoIdParam = MongoIdParamFactory((value) => new MyError(value));
    MongoIdParam('field');

    // Then
    expect(paramSpy).toHaveBeenCalledTimes(1);
    const [fieldArg, pipeClass] = paramSpy.mock.calls[0] as unknown as [string, new () => PipeTransform];
    expect(fieldArg).toEqual('field');
    expect(pipeClass).toBeTruthy();

    // And when
    const evaluator = () => {
      const pipe = new pipeClass();
      pipe.transform('nonsense', {} as any);
    };

    // Then
    expect(evaluator).toThrow(MyError);
  });

});
