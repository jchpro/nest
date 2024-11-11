import { EntityDto } from '@jchpro/nest-mongoose';

export type CommonDto<T> = EntityDto<Omit<T, 'created' | 'updated'>> & {
  created: Date;
  updated: Date;
};
