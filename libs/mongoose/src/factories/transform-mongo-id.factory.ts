import { Transform } from 'class-transformer';
import type { TransformOptions } from 'class-transformer';

/**
 * Duck-typed instead of `instanceof`, which fails when the app has more than one copy of Mongoose (or `bson`).
 */
function isObjectId(value: unknown): value is { toString(): string } {
  return typeof value === 'object' && !!value && (value as { _bsontype?: unknown })._bsontype === 'ObjectId';
}

/**
 * Returns transform decorator which fixes a bug which causes the MongoID to be incorrectly serialized to string.
 * @see https://github.com/typestack/class-transformer/issues/494#issuecomment-712707954
 */
export function TransformMongoIdFactory(options?: TransformMongoIdOptions, extraOptions?: TransformOptions) {
  const idField = options?.documentIdField ?? '_id';
  return function TransformMongoId() {
    return Transform(params => {
      const value: unknown = params.obj[params.key];
      if (isObjectId(value)) {
        return value.toString();
      }
      if (typeof value === 'object' && !!value) {
        if (idField in value && isObjectId((value as Record<string, any>)[idField])) {
          return (value[idField as keyof typeof value] as { toString(): string }).toString();
        }
      }
    }, extraOptions);
  }
}

export interface TransformMongoIdOptions {

  /**
   * Field name for Mongo document ID.
   *
   * @default '_id'
   */
  documentIdField?: string;
}
