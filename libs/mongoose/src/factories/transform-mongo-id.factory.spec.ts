import type { TransformFnParams } from 'class-transformer';
import { Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { TransformMongoIdFactory } from './transform-mongo-id.factory';

let transformArgs: any[] = [];

jest.mock('class-transformer', () => {
  const actual = jest.requireActual('class-transformer');
  return {
    ...actual,
    Transform: (...args: any[]) => {
      transformArgs = args;
    },
  };
});

describe('TransformMongoIdFactory', () => {
  let mockTransformer: any;

  beforeEach(() => {
    transformArgs = [];
    mockTransformer = jest.requireMock('class-transformer');
  });

  it('should pass proper extra options to `Transform` decorator', () => {
    // Given
    const TransformDefault = TransformMongoIdFactory();

    // When
    class MyEntity {
      @TransformDefault()
      field: string;
    }

    // Then
    expect(transformArgs[1]).toBeUndefined();

    // Given
    const TransformOther = TransformMongoIdFactory(undefined, { toClassOnly: true });

    // When
    class MyOtherEntity {
      @TransformOther()
      field: string;
    }

    // Then
    expect(transformArgs[1]).toEqual({ toClassOnly: true });
  });

  it('should properly transform MongoID from an input object', () => {
    // Given
    const Transform = TransformMongoIdFactory();
    Transform();
    const transformFn: (params: TransformFnParams) => any = transformArgs[0];

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
    const TransformDefault = TransformMongoIdFactory();
    TransformDefault();
    let transformFn: (params: TransformFnParams) => any = transformArgs[0];

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
    const TransformFancy = TransformMongoIdFactory({
      documentIdField: 'fancyID'
    });
    TransformFancy();
    transformFn = transformArgs[0];

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
