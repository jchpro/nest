import 'reflect-metadata';
import { METADATA_KEY } from '../consts/metadata-key';
import { EnvPropertyMetadata } from '../types/env-property.metadata';

/**
 * Decorator for marking config class properties for mapping from `process.env` during {@link ConfigModule} initialization.
 * If `variableName is not provided, property keys is treated as one.
 *
 * @example
 * ```typescript
 *
 * class MyConfig {
 *
 *   // Providing environment variable name explicitly
 *   @EnvProperty('NODE_ENV')
 *   @IsString()
 *   readonly nodeEnvironment: string;
 *
 *   // `SERVER_PORT` will be used as an environment variable name
 *   @EnvProperty()
 *   @IsNumber()
 *   readonly SERVER_PORT: number;
 * }
 *
 * ```
 */
export function EnvProperty(variableName?: string): PropertyDecorator {
  return (target: object, propertyKey: string) => {
    const ctor = target.constructor;
    const metadataArr: EnvPropertyMetadata[] =
      Reflect.getMetadata(METADATA_KEY, ctor) ?? [];
    metadataArr.push({
      variableName: variableName ?? propertyKey,
      propertyKey,
    });
    Reflect.defineMetadata(METADATA_KEY, metadataArr, ctor);
  };
}

