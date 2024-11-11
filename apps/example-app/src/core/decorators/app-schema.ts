import { AppSchemaFactory } from '@jchpro/nest-mongoose';

export const AppSchema = AppSchemaFactory({
  timestamps: {
    createdAt: 'created',
    updatedAt: 'updated'
  }
});
