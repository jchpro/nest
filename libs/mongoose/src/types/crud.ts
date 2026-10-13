import { type FilterQuery } from 'mongoose';

export interface FilterQueryProvider<TRaw = any> {
  getFilters(): FilterQuery<TRaw>;
}

export interface CrudOptions {

  /**
   * Maximum limit value for queries, optional. It caps a requested limit and applies when none is requested.
   */
  maxLimit?: number;
}
