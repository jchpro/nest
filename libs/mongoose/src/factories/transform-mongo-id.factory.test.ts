import type { TransformFnParams } from 'class-transformer';
import * as ClassTransformerModule from 'class-transformer';
import { Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMongoIdFactory } from './transform-mongo-id.factory.js';

vi.mock('class-transformer', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof ClassTransformerModule>()),
  };
});

describe('TransformMongoIdFactory', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass proper extra options to `Transform` decorator', () => {
    // Given
    const transformSpy = vi.spyOn(ClassTransformerModule, 'Transform');

    // When
    TransformMongoIdFactory()();

    // Then
    expect(transformSpy.mock.calls[0][1]).toBeUndefined();

    // When
    TransformMongoIdFactory(undefined, { toClassOnly: true })();

    // Then
    expect(transformSpy.mock.calls[1][1]).toEqual({ toClassOnly: true });
  });

  it('should properly transform MongoID from an input object', () => {
    // Given
    const transformSpy = vi.spyOn(ClassTransformerModule, 'Transform');
    TransformMongoIdFactory()();
    const transformFn = transformSpy.mock.calls[0][0] as (params: TransformFnParams) => any;

    // When
    const idHex = randomBytes(12).toString('hex');
    let result = transformFn({
      value: null,
      obj: {
        _id: new Types.ObjectId(idHex)
      },
      key: '_id',
      type: null as any,
      options: null as any
    });

    // Then
    expect(result).toEqual(idHex);

    // When
    result = transformFn({
      value: null,
      obj: {},
      key: '_id',
      type: null as any,
      options: null as any
    });

    // Then
    expect(result).toBeUndefined();
  });

  it('should properly resolve MongoID of a subdocument', () => {
    // Given
    const transformSpy = vi.spyOn(ClassTransformerModule, 'Transform');
    TransformMongoIdFactory()();
    let transformFn = transformSpy.mock.calls[0][0] as (params: TransformFnParams) => any;

    // When
    let idHex = randomBytes(12).toString('hex');
    let result = transformFn({
      value: null,
      obj: {
        doc: {
          _id: new Types.ObjectId(idHex)
        }
      },
      key: 'doc',
      type: null as any,
      options: null as any
    });

    // Then
    expect(result).toEqual(idHex);

    // Given
    TransformMongoIdFactory({ documentIdField: 'fancyID' })();
    transformFn = transformSpy.mock.calls[1][0] as (params: TransformFnParams) => any;

    // When
    idHex = randomBytes(12).toString('hex');
    result = transformFn({
      value: null,
      obj: {
        doc: {
          fancyID: new Types.ObjectId(idHex)
        }
      },
      key: 'doc',
      type: null as any,
      options: null as any
    });

    // Then
    expect(result).toEqual(idHex);
  });

});
