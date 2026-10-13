import { type IdentifiableSchema } from "../types/schemas.js";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type Document } from "mongoose";

/**
 * Value of the `key` of the one lock document.
 * @ignore
 */
export const CHANGELOG_LOCK_KEY = 'migrations';

/**
 * @ignore
 */
@Schema({
  timestamps: false
})
export class ChangelogLock implements IdentifiableSchema {

    readonly _id!: mongoose.Types.ObjectId;

    /**
     * Identifies the one lock document. It is unique, which makes creating the document atomic.
     * Lock documents made by earlier versions don't have it.
     */
    @Prop()
    key?: string;

    @Prop()
    locked!: boolean;

    @Prop()
    processId!: number;

    /**
     * Who holds the lock. Unique per `MigrateService` instance, a process ID isn't enough
     * (instances in one process share it).
     */
    @Prop()
    ownerId?: string;
}

export type ChangelogLockDocument = ChangelogLock & Document;

export const ChangelogLockSchema = SchemaFactory.createForClass(ChangelogLock);
// Partial, so the lock documents without a key don't count as duplicates
ChangelogLockSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } });
