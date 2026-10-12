import { type Types } from 'mongoose';

export interface IdentifiableSchema {
  _id: Types.ObjectId;
}

/**
 * Schema using `softDeletePlugin`; absent `deletedAt` means the document is live.
 */
export interface SoftDeletableSchema {
  deletedAt?: Date;
}
