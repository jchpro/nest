import { type IdentifiableSchema } from "../types/schemas.js";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type Document } from "mongoose";

/**
 * @ignore
 */
@Schema({
  timestamps: false
})
export class Changelog implements IdentifiableSchema {

    readonly _id!: mongoose.Types.ObjectId;

    @Prop({
      immutable: true
    })
    identifier!: string;

    @Prop({
      immutable: true
    })
    applied!: Date;
}

export type ChangelogDocument = Changelog & Document;

export const ChangelogSchema = SchemaFactory.createForClass(Changelog);
