import { QueryExecutor } from '@jchpro/nest-mongoose';

class MockModel<T> {
  constructor(readonly items: T[], readonly count: number ) { }
  find() {
    return {
      exec: async () => {
        return this.items;
      }
    };
  }
  countDocuments() {
    return {
      exec: async () => {
        return this.count;
      }
    };
  }
}

class Entity {
  constructor(readonly name: string) { }
}

describe('QueryExecutor', () => {

  it('should properly set mongoose query data for minimal configuration and resolve data from the model', async () => {
    // Given
    const model = new MockModel([new Entity('A'), new Entity('B')], 10);
    const executor = new QueryExecutor(model as any, {});

    // Then
    expect(executor.filters).toEqual({});
    expect(executor.queryOptions).toEqual({});
    expect(executor.maxLimit).toBeFalsy();
    expect(executor.projection).toBeFalsy();

    // And when
    const result = await executor.execute();

    // Then
    expect(result.items).toEqual([new Entity('A'), new Entity('B')]);
    expect(result.total).toEqual(10);
  });

  it('should properly set mongoose query data for typical configuration', () => {
    // Given
    const executor = new QueryExecutor({ } as any, {
      offset: 3,
      limit: 25,
      sortBy: 'field',
      sortDesc: true
    });

    // Then
    expect(executor.queryOptions).toEqual({
      skip: 3,
      limit: 25,
      sort: {
        field: -1
      }
    });
  });

  it('should use queries provided in the execute instead of the ones from the model', async () => {
    // Given
    const defaultModel = new MockModel([], 0);
    const executor = new QueryExecutor(defaultModel as any, {});
    const effectiveModel = new MockModel([new Entity('A'), new Entity('B')], 10);

    // When
    const result = await executor.execute(
      effectiveModel.countDocuments() as any,
      effectiveModel.find() as any
    );
    
    // Then
    expect(result.items).toEqual([new Entity('A'), new Entity('B')]);
    expect(result.total).toEqual(10);
  });
});
