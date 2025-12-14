import { PolymorphismHelper } from '@jchpro/nest-common';
import { ApiProperty, getSchemaPath } from '../internal/swagger';
import { ApiPropertyOptions } from '@nestjs/swagger';

/**
 * Helper class for polymorphic API models using `@nestjs/swagger` decorators.
 */
export class PolymorphismApiHelper<T> extends PolymorphismHelper<T> {

  /**
   * Returns an `ApiProperty` property decorator of `@nestjs/swagger` with polymorphism properly configured.
   */
  ApiProperty(options?: PolymorphicApiPropertyOptions,
              extraOptions?: Omit<ApiPropertyOptions, 'required' | 'type' | 'items' | 'oneOf' | 'discriminator'>) {
    const common = {
      required: options?.required ?? true,
      oneOf: Array.from(this.map.values())
                  .map(model => ({ $ref: getSchemaPath(model) })),
      discriminator: {
        propertyName: this.discriminator,
        mapping: Object.fromEntries(
          Array.from(this.map.entries())
               .map(([value, model]) => [value, getSchemaPath(model)])
        )
      }
    };
    return ApiProperty(options?.isArray ? {
      type: 'array',
      required: common.required,
      items: { oneOf: common.oneOf },
      discriminator: common.discriminator,
      ...extraOptions
    } : {
      ...common,
      ...extraOptions
    });
  }

}


export interface PolymorphicApiPropertyOptions {

  /**
   * Passed down to `ApiProperty` decorator of `@nestjs/swagger`.
   *
   * @default true
   */
  required?: boolean;

  /**
   * Whether the fields should be declared an array of polymorphic models;
   * defines which `ApiProperty` options schema is used.
   *
   * @default false
   */
  isArray?: boolean;
}
