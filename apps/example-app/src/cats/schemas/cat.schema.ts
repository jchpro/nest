import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { AppSchema } from '../../core/decorators/app-schema';
import { CommonSchema } from '../../core/types/schemas';

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
}

export type CatDocument = Cat & Document;

export const CatSchema = SchemaFactory.createForClass(Cat);
