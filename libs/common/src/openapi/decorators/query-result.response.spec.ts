import { QueryResult } from '@jchpro/nest-common';
import { ApiQueryResultResponse } from '@jchpro/nest-common/openapi';
import type { CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

class MyEntity {
  name: string;
  constructor(obj: { name: string }) {
    this.name = obj.name;
  }
}

let useInterceptorArgs: any[] = [];

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    UseInterceptors: (...args: any[]) => {
      useInterceptorArgs = args;
    }
  };
});


describe('QueryResultResponse', () => {
  let mockSwagger: any;
  let mockCommon: any;

  function getMockHandler<T>(result: T): CallHandler<T> {
    return {
      handle(): Observable<T> {
        return of(result);
      },
    }
  }

  beforeEach(() => {
    useInterceptorArgs = [];
    mockSwagger = jest.requireActual('../internal/swagger');
    mockCommon = jest.requireMock('@nestjs/common');
  });

  it('should pass the right options object to ApiOkResponse decorator', () => {
    // Given
    const okResSpy = jest.spyOn(mockSwagger, 'ApiOkResponse');

    // When
    ApiQueryResultResponse(MyEntity, {
      totalHeader: {
        name: 'Fancy-Header',
        options: {
          description: 'test'
        }
      },
      response: {
        description: 'test',
      }
    });

    // Then
    expect(okResSpy).toHaveBeenCalledWith({
      type: MyEntity,
      isArray: true,
      description: 'test',
      headers: {
        'Fancy-Header': {
          description: 'test',
          schema: {
            type: 'number'
          }
        }
      }
    });
  });

  it('should pass properly configured interceptor which handles mapping and header setting to UseInterceptors decorator', () => {
    // Given
    const useInterceptorsSpy = jest.spyOn(mockCommon, 'UseInterceptors');
    let setHeaderResult: { name?: string, total?: string } = {};
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => ({
          setHeader: (name: string, total: string) => {
            setHeaderResult = { name, total };
          }
        })
      })
    };

    // When
    ApiQueryResultResponse(MyEntity, {
      map: (obj: any) => new MyEntity(obj),
      totalHeader: {
        name: 'Fancy-Header',
      }
    });

    // Then
    expect(useInterceptorsSpy).toHaveBeenCalledTimes(1);
    expect(useInterceptorArgs[0]).toBeTruthy();

    const interceptor: {
      intercept: (context: any, next: CallHandler<unknown>) => Observable<any>
    } = useInterceptorArgs[0];

    // And (if not QueryResult)
    let interceptedHandler = interceptor.intercept(
      mockContext,
      getMockHandler([
        { one: '1' },
        { two: '2' }
      ])
    );
    let handleResult: any;
    interceptedHandler
      .subscribe((result) => {
        handleResult = result
      });
    expect(setHeaderResult).toEqual({});
    expect(handleResult)
      .toEqual([
        { one: '1' },
        { two: '2' }
      ]);

    // And (if QueryResult)
    interceptedHandler = interceptor.intercept(
      mockContext,
      getMockHandler(new QueryResult([
        { name: 'A', extra: true, },
        { name: 'B' }
      ], 42))
    );
    interceptedHandler
      .subscribe((result) => {
        handleResult = result
      });
    expect(setHeaderResult).toEqual({
      name: 'Fancy-Header',
      total: 42
    });
    expect(handleResult).toEqual([
      new MyEntity({name: 'A'}),
      new MyEntity({name: 'B'}),
    ]);

  });

});
