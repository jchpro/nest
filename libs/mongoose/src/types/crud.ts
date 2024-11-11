import { FilterQuery } from 'mongoose';

export interface FilterQueryProvider<TRaw = any> {
  getFilters(): FilterQuery<TRaw>;
}

export interface CrudOptions {

  /**
   * Maximum limit value for queries, optional.
   */
  maxLimit?: number;
}
