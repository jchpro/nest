import { type CrudOptions, QueryService } from '../index.js';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MONGOOSE_CRUD_OPTIONS } from '../consts/injection-tokens.js';
import type * as QueryExecutorModule from './query.executor.js';

vi.mock('./query.executor', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof QueryExecutorModule>()),
    QueryExecutor: class MockExecutor {
      readonly args: any[];
      constructor(
        ...args: any[]
      ) {
        this.args = args;
      }
    },
  };
});

describe('QueryService', () => {
  let service: QueryService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: MONGOOSE_CRUD_OPTIONS, useValue: { maxLimit: 50 } as CrudOptions },
        QueryService
      ]
    }).compile();
    service = moduleRef.get(QueryService);
  });

  it('should return instance of query executor passing the right arguments', () => {
    // Given
    const executor = service.prepare(
      { iam: 'model' } as any,
      { limit: 20 },
      undefined,
      'projection',
      {}
    );

    // Then
    const [one, two, three] = (executor as any).args;
    expect(one).toEqual({ iam: 'model' });
    expect(two).toEqual({ limit: 20 });
    expect(three).toEqual({
      filtersProvider: undefined,
      project: 'projection',
      crud: { maxLimit: 50 },
      other: {}
    });
  });

});
