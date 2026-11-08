import type { MongooseFilter } from './filter.js';

export interface FilterQueryProvider<TRaw = any> {
  getFilters(): MongooseFilter<TRaw>;
}

export interface CrudOptions {

  /**
   * Maximum limit value for queries, optional. It caps a requested limit and applies when none is requested.
   */
  maxLimit?: number;
}
