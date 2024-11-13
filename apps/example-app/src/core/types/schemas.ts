import { IdentifiableSchema } from '@jchpro/nest-mongoose';

export interface CommonSchema extends IdentifiableSchema {
  created: Date;
  updated: Date;
}
