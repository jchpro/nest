import { QueryData, QueryResult } from '@jchpro/nest-common';
import { Inject, Injectable } from '@nestjs/common';
import { Document, Model, ProjectionType } from 'mongoose';
import { MONGOOSE_CRUD_OPTIONS } from '../consts/injection-tokens';
import { CrudOptions, FilterQueryProvider } from '../types/crud';
import { OtherQueryOptions, QueryExecutor } from './query.executor';

@Injectable()
export class QueryService {

  constructor(
    @Inject(MONGOOSE_CRUD_OPTIONS)
    private readonly crudOptions?: CrudOptions
  ) { }

  prepare<TDoc extends Document, TRaw = any>(model: Model<TDoc>,
                                             data: QueryData,
                                             filtersProvider?: FilterQueryProvider<TRaw>,
                                             project?: ProjectionType<TRaw>,
                                             other?: OtherQueryOptions): QueryExecutor<TDoc, TRaw> {
    return new QueryExecutor<TDoc, TRaw>(
      model,
      data,
      {
        filtersProvider,
        project,
        crud: this.crudOptions,
        other
      }
    );
  }

  execute<TDoc extends Document, TRaw = any>(model: Model<TDoc>,
                                             data: QueryData,
                                             filtersProvider?: FilterQueryProvider<TRaw>,
                                             project?: ProjectionType<TRaw>,
                                             other?: OtherQueryOptions): Promise<QueryResult<TDoc>> {
    return this.prepare(model, data, filtersProvider, project, other)
      .execute();
  }

}
