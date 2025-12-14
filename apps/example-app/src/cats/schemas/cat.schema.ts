import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { AppSchema } from '../../core/decorators/app-schema';
import { CommonSchema } from '../../core/types/schemas';
import { Owner } from './owner.schema';

@AppSchema()
export class Cat implements CommonSchema {

  readonly _id: Schema.Types.ObjectId;
  readonly created: Date;
  readonly updated: Date;

  @Prop({
    trim: true
  })
  name: string;

  @Prop()
  birthDate: Date;

  @Prop()
  color: string;

  @Prop()
  weightG: number;

  @Prop()
  isCute: boolean;

  @Prop({
    type: Schema.Types.ObjectId,
    ref: Owner.name,
    required: false
  })
  owner?: Schema.Types.ObjectId;
}

export type CatDocument = Cat & Document;

export const CatSchema = SchemaFactory.createForClass(Cat);
