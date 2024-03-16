import { Schema } from 'mongoose';

export interface IdentifiableSchema {
  _id: Schema.Types.ObjectId;
}
