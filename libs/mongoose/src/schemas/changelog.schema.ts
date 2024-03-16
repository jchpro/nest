import { IdentifiableSchema } from "../types/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

/**
 * @ignore
 */
@Schema({
  timestamps: false
})
export class Changelog implements IdentifiableSchema {

    readonly _id: MongooseSchema.Types.ObjectId;

    @Prop({
      immutable: true
    })
    identifier: string;

    @Prop({
      immutable: true
    })
    applied: Date;
}

export type ChangelogDocument = Changelog & Document;

export const ChangelogSchema = SchemaFactory.createForClass(Changelog);
