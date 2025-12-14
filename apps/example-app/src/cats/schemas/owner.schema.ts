import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { AppSchema } from '../../core/decorators/app-schema';
import { CommonSchema } from '../../core/types/schemas';

@AppSchema()
export class Owner implements CommonSchema {

  readonly _id: Schema.Types.ObjectId;
  readonly created: Date;
  readonly updated: Date;

  @Prop({
    required: true
  })
  name: string;

}

export type OwnerDocument = Owner & Document;

export const OwnerSchema = SchemaFactory.createForClass(Owner);
