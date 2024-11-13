import { Schema, SchemaOptions } from '@nestjs/mongoose';

/**
 * Returns Schema decorator combining provided `defaultOptions` with specific schema options.
 */
export function AppSchemaFactory(defaultOptions?: SchemaOptions) {
  return function AppSchema(options?: SchemaOptions) {
    return Schema({
      ...defaultOptions,
      ...options,
    });
  };
}
