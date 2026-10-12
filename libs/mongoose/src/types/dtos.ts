export type EntityDto<T> = Omit<T, '_id'> & {
  readonly _id: string;
};
