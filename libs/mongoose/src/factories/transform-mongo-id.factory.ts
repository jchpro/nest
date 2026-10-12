import { Transform } from 'class-transformer';
import type { TransformOptions } from 'class-transformer';
import mongoose from 'mongoose';

/**
 * Returns transform decorator which fixes a bug which causes the MongoID to be incorrectly serialized to string.
 * @see https://github.com/typestack/class-transformer/issues/494#issuecomment-712707954
 */
export function TransformMongoIdFactory(options?: TransformMongoIdOptions, extraOptions?: TransformOptions) {
  const idField = options?.documentIdField ?? '_id';
  return function TransformMongoId() {
    return Transform(params => {
      const value: unknown = params.obj[params.key];
      if (value instanceof mongoose.Types.ObjectId) {
        return value.toString();
      }
      if (typeof value === 'object' && !!value) {
        if (idField in value && (value as Record<string, any>)[idField] instanceof mongoose.Types.ObjectId) {
          return (value[idField as keyof typeof value] as mongoose.Types.ObjectId).toString();
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
