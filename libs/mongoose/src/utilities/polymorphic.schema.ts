import { Type as ClassConstructor } from "@nestjs/common/interfaces/type.interface";
import { PolymorphismHelper } from '@jchpro/nest-common';
import { SchemaFactory } from '@nestjs/mongoose';
import { Schema } from 'mongoose';


/**
 * Helper class for creating polymorphic Mongoose schemas.
 */
export class PolymorphicSchema<T> extends PolymorphismHelper<T> {

  /**
   * Output schema is available here.
   */
  readonly schema: Schema;

  constructor(
    discriminator: string,
    base: ClassConstructor
  ) {
    super(discriminator, base);
    this.schema = SchemaFactory.createForClass(base);
  }

  /**
   * Register a polymorphic type as a discriminator for the base schema.
   */
  register(value: T, subType: ClassConstructor) {
    super.register(value, subType);
    if (this.map.get(value) !== subType) {
      return;
    }
    const subSchema = SchemaFactory.createForClass(subType);
    this.schema.discriminator(value as string | number, subSchema);
  }

}
