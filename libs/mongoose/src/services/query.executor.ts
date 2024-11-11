import { QueryData, QueryResult } from '@jchpro/nest-common';
import type { Document, FilterQuery, Model, ProjectionType, Query, QueryOptions } from 'mongoose';
import { CrudOptions, FilterQueryProvider } from '../types/crud';

/**
 * Holds the query data for a given mongoose model and allows
 * execution of `count`, `find`, or both using `execute`.
 */
export class QueryExecutor<TDoc extends Document, TRaw = any> {

  readonly maxLimit?: number;
  readonly filters: FilterQuery<TRaw>;
  readonly queryOptions: QueryOptions<TDoc>;
  readonly projection?: ProjectionType<TRaw>;

  constructor(
    readonly model: Model<TDoc>,
    readonly data: QueryData,
    options?: {
      readonly filtersProvider?: FilterQueryProvider<TRaw>;
      readonly project?: ProjectionType<TRaw>
      readonly crud?: CrudOptions;
      readonly other?: OtherQueryOptions;
    }
  ) {
    const { maxLimit } = options?.crud ?? {};
    this.maxLimit = maxLimit;
    this.projection = options?.project;
    this.filters = options?.filtersProvider?.getFilters() ?? {};
    this.queryOptions = this.resolveQueryOptions(options?.other);
  }

  async execute(count?: Query<number, TDoc>, find?: Query<TDoc[], TDoc>): Promise<QueryResult<TDoc>> {
    const countQuery = count ?? this.count();
    const findQuery = find ?? this.find();
    const [total, items] = await Promise.all([countQuery.exec(), findQuery.exec()]);
    return new QueryResult(
      items,
      total,
      this.queryOptions.limit,
      this.queryOptions.skip
    );
  }

  count(): Query<number, TDoc> {
    return this.model.countDocuments(this.filters);
  }

  find(): Query<TDoc[], TDoc> {
    return this.model.find(
      this.filters,
      this.projection,
      this.queryOptions,
    );
  }

  private resolveQueryOptions(other?: OtherQueryOptions): QueryOptions<TDoc> {
    const { offset, limit, sortBy, sortDesc } = this.data;
    const queryOptions: QueryOptions<TDoc> = { ...other };
    if (typeof offset === 'number') {
      queryOptions.skip = offset;
    }
    if (typeof limit === 'number') {
      if (limit > (this.maxLimit ?? Infinity)) {
        queryOptions.limit = this.maxLimit;
      } else {
        queryOptions.limit = limit;
      }
    }
    if (typeof sortBy === 'string') {
      queryOptions.sort = {
        [sortBy]: sortDesc ? -1 : 1
      };
    }
    return queryOptions;
  }

}

export type OtherQueryOptions = Omit<QueryOptions, 'skip' | 'limit' | 'sort'>;
