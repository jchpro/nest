import { reusableApiEnum } from '@jchpro/nest-common/openapi';

export enum CatBreed {
  Siamese = 'siamese',
  MaineCoon = 'maine-coon',
  Persian = 'persian',
  Bengal = 'bengal',
  Other = 'other',
}

// Every `@ApiEnum(CatBreed)` is documented as a reference to the same `CatBreed` schema
reusableApiEnum(CatBreed, 'CatBreed');
