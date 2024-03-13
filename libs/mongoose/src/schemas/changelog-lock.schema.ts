import { IdentifiableSchema } from "../types/schemas";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

/**
 * @ignore
 */
@Schema({
  timestamps: false
})
export class ChangelogLock implements IdentifiableSchema {

    readonly _id: MongooseSchema.Types.ObjectId;

    @Prop()
    locked: boolean;

    @Prop()
    processId: number;
}

export type ChangelogLockDocument = ChangelogLock & Document;

export const ChangelogLockSchema = SchemaFactory.createForClass(ChangelogLock);
