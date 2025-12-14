import { Logger, Type as ClassConstructor } from '@nestjs/common';
import { Type } from 'class-transformer';

/**
 * Base helper class for polymorphic models.
 */
export class PolymorphismHelper<T> {

  protected readonly logger = new Logger(PolymorphismHelper.name);
  protected readonly map = new Map<T, ClassConstructor>();

  constructor(
    /**
     * Name of the discriminator property.
     */
    readonly discriminator: string,

    /**
     * Base class for which the discriminator is used.
     */
    readonly base: ClassConstructor
  ) {
  }

  /**
   * Register a subtype for a given value.
   * If a subtype for the given value is already registered, a warning will be logged.
   */
  register(value: T, subType: ClassConstructor) {
    if (this.map.has(value)) {
      this.logger.warn(`Sub type of ${this.base.name} already registered for value "${value}", skipping`)
      return;
    }
    this.map.set(value, subType);
  }

  /**
   * Returns a `Type` property decorator of `class-transformer` with polymorphism properly configured.
   */
  Type(options?: PolymorphicTypeOptions) {
    return Type(() => this.base, {
      discriminator: {
        property: this.discriminator,
        subTypes: Array.from(this.map.entries())
           .map(([name, value]) => {
             return { value, name } as { name: string, value: ClassConstructor };
           })
      },
      keepDiscriminatorProperty: options?.keepDiscriminatorProperty ?? true
    });
  }

}

export interface PolymorphicTypeOptions {

  /**
   * Passed down to `Type` decorator of `class-transformer`.
   *
   * @default true
   */
  keepDiscriminatorProperty?: boolean;
}
