import { type IdentifiableSchema } from '@jchpro/nest-mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, type Types } from 'mongoose';
import { AppSchema } from '../shared/app-schema.js';

@AppSchema()
export class Owner implements IdentifiableSchema {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  /** Maintained together with the cats, in a transaction (see `CatsService`). */
  @Prop({ required: true, default: 0 })
  catsCount!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OwnerSchema = SchemaFactory.createForClass(Owner);
export type OwnerDocument = HydratedDocument<Owner>;
