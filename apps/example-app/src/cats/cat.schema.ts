import { type IdentifiableSchema, type SoftDeletableSchema, type SoftDeleteMethods, softDeletePlugin } from '@jchpro/nest-mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument, type Types } from 'mongoose';
import { Owner } from '../owners/owner.schema.js';
import { AppSchema } from '../shared/app-schema.js';
import { CatBreed } from './cat-breed.js';

@AppSchema()
export class Cat implements IdentifiableSchema, SoftDeletableSchema {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, enum: Object.values(CatBreed), required: true })
  breed!: CatBreed;

  // A `ref` is all `SingleConnectionSchemaRefsModule` needs to know that an owner can't be deleted while it has cats
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Owner.name, required: true, index: true })
  owner!: Types.ObjectId;

  deletedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
CatSchema.plugin(softDeletePlugin);

export type CatDocument = HydratedDocument<Cat> & SoftDeleteMethods;
