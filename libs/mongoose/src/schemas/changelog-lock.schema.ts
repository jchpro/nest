import { type IdentifiableSchema } from "../types/schemas.js";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type Document } from "mongoose";

/**
 * @ignore
 */
@Schema({
  timestamps: false
})
export class ChangelogLock implements IdentifiableSchema {

    readonly _id!: mongoose.Types.ObjectId;

    @Prop()
    locked!: boolean;

    @Prop()
    processId!: number;
}

export type ChangelogLockDocument = ChangelogLock & Document;

export const ChangelogLockSchema = SchemaFactory.createForClass(ChangelogLock);
