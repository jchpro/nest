import { applyDecorators, CallHandler, ExecutionContext, NestInterceptor, Type, UseInterceptors } from '@nestjs/common';
import { ApiResponseOptions } from '@nestjs/swagger';
import { map, Observable } from 'rxjs';
import type { Response } from 'express';
import { HeaderObject, HeadersObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { QueryResult } from '@jchpro/nest-common';
import { ApiOkResponse } from '../internal/swagger';

/**
 * Decorator for OK response which is expected to return the {@link QueryResult}.
 * It applies {@link ApiOkResponse} and {@link QueryResultInterceptor} to the method.
 */
export function ApiQueryResultResponse(type: Type,
                                       options?: QueryResultResponseOptions): MethodDecorator {
  return applyDecorators(
    ApiOkResponse({
      type,
      isArray: true,
      headers: {
        [QueryResultInterceptor.getHeaderName(options?.totalHeader?.name)]: {
          description: 'Total number of entities for provided specification',
          ...options?.totalHeader?.options,
          schema: { type: 'number' }
        },
        ...options?.extraHeaders
      },
      ...options?.response
    }),
    UseInterceptors(new QueryResultInterceptor(options))
  );
}

export interface QueryResultResponseOptions {

  /**
   * Function for mapping result items.
   */
  map?: (item: any) => any;

  /**
   * Extra options for the total items count header.
   */
  totalHeader?: QueryResultTotalHeaderOptions;

  /**
   * Extra options for the `ApiOkResponse`.
   */
  response?: Omit<ApiResponseOptions, 'type' | 'isArray' | 'headers'>

  /**
   * Extra headers
   */
  extraHeaders?: HeadersObject;
}

export interface QueryResultTotalHeaderOptions {

  /**
   * Name of the header with total items count, defaults to "X-Total-Count".
   */
  name?: string;

  /**
   * Options for the total items count header.
   */
  options?: HeaderObject;
}

/**
 * If method's return value is {@link QueryResult}, interceptor returns the items,
 * sets the total items count header and optionally maps the items with a provided mapping function.
 */
class QueryResultInterceptor implements NestInterceptor<unknown> {

  private readonly map?: (item?: any) => any;
  private readonly headerName: string;

  constructor(
    options?: QueryResultResponseOptions
  ) {
    this.map = options?.map;
    this.headerName = QueryResultInterceptor.getHeaderName(options?.totalHeader?.name);
  }

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<any> | Promise<Observable<any>> {
    const res = context.switchToHttp().getResponse<Response>();
    return next
      .handle()
      .pipe(
        map((result) => {
          if (result instanceof QueryResult) {
            res.setHeader(this.headerName, result.total);
            return this.map ? result.map(this.map) : result.items;
          }
          return result;
        })
      );
  }

  static getHeaderName(headerName?: string): string {
    return headerName ?? 'X-Total-Count';
  }

}
