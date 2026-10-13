import type * as SwaggerModuleType from '@nestjs/swagger';
import { ValidateFactory } from '../index.js';
import type * as NestCommonModule from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  usePipesArgs: [] as any[],
}));

vi.mock('@nestjs/swagger', async (importOriginal) => {
  const actual = await importOriginal<typeof SwaggerModuleType>();
  return {
    ...actual,
    ApiBadRequestResponse: vi.fn(actual.ApiBadRequestResponse),
  };
});

vi.mock('@nestjs/common', async (importOriginal) => {
  const actual = await importOriginal<typeof NestCommonModule>();
  return {
    ...actual,
    UsePipes: (...args: any[]) => {
      state.usePipesArgs = args;
    },
    ValidationPipe: class {
      constructor(
        readonly arg: any
      ) {
      }
    }
  };
});

describe('ValidateFactory', () => {
  let mockSwagger: any;
  let mockCommon: any;

  beforeEach(async () => {
    state.usePipesArgs = [];
    mockSwagger = await import('@nestjs/swagger');
    mockCommon = await import('@nestjs/common');
  });

  it('should pass along ApiBadRequestResponse option to internal decorator', () => {
    // Give
    const badReqResSpy = vi.spyOn(mockSwagger, 'ApiBadRequestResponse');
    const Validate = ValidateFactory(
      { description: 'test' },
      { }
    );

    // When
    Validate();

    // Then
    expect(badReqResSpy).toHaveBeenCalledWith({ description: 'test' });
  });


  it('should pass along ValidationPipe option to internal decorator', () => {
    // Give
    const usePipesSpy = vi.spyOn(mockCommon, 'UsePipes');
    const Validate = ValidateFactory(
      { },
      { always: true }
    );

    // When
    Validate();

    // Then
    expect(usePipesSpy).toHaveBeenCalledTimes(1);
    expect(state.usePipesArgs[0]).toBeTruthy();
    expect(state.usePipesArgs[0].arg).toEqual({ always: true });

    // And when
    Validate({ always: false });

    // Then
    expect(usePipesSpy).toHaveBeenCalledTimes(2);
    expect(state.usePipesArgs[0]).toBeTruthy();
    expect(state.usePipesArgs[0].arg).toEqual({ always: false });
  });

});
