import { ConflictException } from '@nestjs/common';
import { ReferencingDocsLookupService } from './referencing-docs-lookup.service';
import { SchemaRefInfo } from '../utilities/schema-refs';
import { SingleConnectionSchemaRefsOptions } from '../single-connection-schema-refs.module';

type ExecDoc = Record<string, any>;

class MockObjectId {
  constructor(private readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

function createModelMock(docsToReturn: ExecDoc[]) {
  const exec = jest.fn().mockResolvedValue(docsToReturn);
  const lean = jest.fn().mockReturnValue({ exec });
  const select = jest.fn().mockReturnValue({ lean, exec }); // exec not used here, but harmless
  const find = jest.fn().mockReturnValue({ select, lean, exec });

  return {
    find,
    select,
    lean,
    exec,
  };
}

describe('ReferencingDocsLookupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('find() should query each referenced schema and return aggregated infos (default idField=_id)', async () => {
    const referencedId = new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') as any;

    const catModel = createModelMock([
      { _id: new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') },
      { _id: new MockObjectId('64b64c2f2f2f2f2f2f2f2f30') },
    ]);
    const dogModel = createModelMock([]); // no refs
    const toyModel = createModelMock([{ _id: new MockObjectId('64b64c2f2f2f2f2f2f2f2f31') }]);

    const connectionMock: any = {
      model: jest.fn((name: string) => {
        if (name === 'Cat') return catModel;
        if (name === 'Dog') return dogModel;
        if (name === 'Toy') return toyModel;
        throw new Error(`Unexpected model requested: ${name}`);
      }),
    };

    const service = new ReferencingDocsLookupService(connectionMock, undefined);

    const externalRefs: SchemaRefInfo[] = [
      { schema: 'Cat', path: 'owner', ref: 'User' },
      { schema: 'Dog', path: 'owner', ref: 'User' },
      { schema: 'Toy', path: 'manufacturer', ref: 'Company' },
    ];

    const infos = await service.find(referencedId, externalRefs);

    // Ensure correct model resolution
    expect(connectionMock.model).toHaveBeenCalledTimes(3);
    expect(connectionMock.model).toHaveBeenNthCalledWith(1, 'Cat');
    expect(connectionMock.model).toHaveBeenNthCalledWith(2, 'Dog');
    expect(connectionMock.model).toHaveBeenNthCalledWith(3, 'Toy');

    // Ensure query chain called with correct filter and select field
    expect(catModel.find).toHaveBeenCalledWith({ owner: referencedId });
    expect(catModel.select).toHaveBeenCalledWith('_id');
    expect(catModel.lean).toHaveBeenCalled();
    expect(catModel.exec).toHaveBeenCalled();

    expect(dogModel.find).toHaveBeenCalledWith({ owner: referencedId });
    expect(dogModel.select).toHaveBeenCalledWith('_id');

    expect(toyModel.find).toHaveBeenCalledWith({ manufacturer: referencedId });
    expect(toyModel.select).toHaveBeenCalledWith('_id');

    // Only schemas with docs should be returned
    expect(infos).toEqual([
      {
        name: 'Cat',
        count: 2,
        ids: ['64b64c2f2f2f2f2f2f2f2f2f', '64b64c2f2f2f2f2f2f2f2f30'],
      },
      {
        name: 'Toy',
        count: 1,
        ids: ['64b64c2f2f2f2f2f2f2f2f31'],
      },
    ]);
  });

  it('find() should use custom idField from options', async () => {
    const referencedId = new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') as any;

    const model = createModelMock([{ customId: new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') }]);

    const connectionMock: any = {
      model: jest.fn(() => model),
    };

    const options: SingleConnectionSchemaRefsOptions = {
      idField: 'customId',
    };

    const service = new ReferencingDocsLookupService(connectionMock, options);

    const externalRefs: SchemaRefInfo[] = [{ schema: 'Cat', path: 'owner', ref: 'User' }];

    const infos = await service.find(referencedId, externalRefs);

    expect(model.find).toHaveBeenCalledWith({ owner: referencedId });
    expect(model.select).toHaveBeenCalledWith('customId');

    expect(infos).toEqual([
      {
        name: 'Cat',
        count: 1,
        ids: ['64b64c2f2f2f2f2f2f2f2f2f'],
      },
    ]);
  });

  it('assertUnreferenced() should throw error from method errorFactory when references exist', async () => {
    const referencedId = new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') as any;

    const model = createModelMock([{ _id: new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') }]);
    const connectionMock: any = {
      model: jest.fn(() => model),
    };

    const service = new ReferencingDocsLookupService(connectionMock, undefined);

    const externalRefs: SchemaRefInfo[] = [{ schema: 'Cat', path: 'owner', ref: 'User' }];

    class MyMethodError extends Error {
      constructor(readonly id: string) {
        super(`method factory: ${id}`);
      }
    }

    const methodFactory = jest.fn((id: string) => new MyMethodError(id));

    await expect(service.assertUnreferenced(referencedId, externalRefs, methodFactory)).rejects.toBeInstanceOf(
      MyMethodError,
    );

    expect(methodFactory).toHaveBeenCalledTimes(1);
    expect(methodFactory).toHaveBeenCalledWith(referencedId.toString(), expect.any(Array));
  });

  it('assertUnreferenced() should throw error from options.unrefAssertionErrorFactory when references exist and no method factory provided', async () => {
    const referencedId = new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') as any;

    const model = createModelMock([{ _id: new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') }]);
    const connectionMock: any = {
      model: jest.fn(() => model),
    };

    class MyOptionsError extends Error {
      constructor(readonly id: string) {
        super(`options factory: ${id}`);
      }
    }

    const options: SingleConnectionSchemaRefsOptions = {
      unrefAssertionErrorFactory: (id: string) => new MyOptionsError(id),
    };

    const service = new ReferencingDocsLookupService(connectionMock, options);

    const externalRefs: SchemaRefInfo[] = [{ schema: 'Cat', path: 'owner', ref: 'User' }];

    await expect(service.assertUnreferenced(referencedId, externalRefs)).rejects.toBeInstanceOf(MyOptionsError);
  });

  it('assertUnreferenced() should throw default ConflictException when references exist and no factories provided', async () => {
    const referencedId = new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') as any;

    const model = createModelMock([
      { _id: new MockObjectId('64b64c2f2f2f2f2f2f2f2f30') },
      { _id: new MockObjectId('64b64c2f2f2f2f2f2f2f2f31') },
    ]);

    const connectionMock: any = {
      model: jest.fn(() => model),
    };

    const service = new ReferencingDocsLookupService(connectionMock, undefined);

    const externalRefs: SchemaRefInfo[] = [{ schema: 'Cat', path: 'owner', ref: 'User' }];

    await expect(service.assertUnreferenced(referencedId, externalRefs)).rejects.toBeInstanceOf(ConflictException);

    await expect(service.assertUnreferenced(referencedId, externalRefs)).rejects.toMatchObject({
      message: expect.stringContaining(`Object with ID ${referencedId.toString()} is still referenced by:`),
    });
  });

  it('assertUnreferenced() should not throw when no references exist', async () => {
    const referencedId = new MockObjectId('64b64c2f2f2f2f2f2f2f2f2f') as any;

    const model = createModelMock([]);
    const connectionMock: any = {
      model: jest.fn(() => model),
    };

    const service = new ReferencingDocsLookupService(connectionMock, undefined);

    const externalRefs: SchemaRefInfo[] = [{ schema: 'Cat', path: 'owner', ref: 'User' }];

    await expect(service.assertUnreferenced(referencedId, externalRefs)).resolves.toBeUndefined();
  });
});
