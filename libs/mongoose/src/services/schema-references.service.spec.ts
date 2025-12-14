import { Schema } from 'mongoose';
import { SchemaReferencesService } from './schema-references.service';
import { extractSchemaRefs, type SchemaRefInfo } from '../utilities/schema-refs';

jest.mock('../utilities/schema-refs', () => {
  return {
    extractSchemaRefs: jest.fn(),
  };
});

describe('SchemaReferencesService', () => {
  let service: SchemaReferencesService;

  beforeEach(() => {
    service = new SchemaReferencesService();
    jest.clearAllMocks();
  });

  it('should not store anything when extractSchemaRefs returns empty array', () => {
    (extractSchemaRefs as jest.Mock).mockReturnValueOnce([]);

    service.register(new Schema({}), 'Cat');

    expect(extractSchemaRefs).toHaveBeenCalledTimes(1);
    expect(extractSchemaRefs).toHaveBeenCalledWith(expect.any(Schema), 'Cat');

    expect(service.getRefsForSchema('Cat')).toEqual([]);
    expect(service.getSchemasReferencing('User')).toEqual([]);
  });

  it('should store schema -> refs and ref -> schemas mappings based on extractSchemaRefs output', () => {
    const refs: SchemaRefInfo[] = [
      { schema: 'Cat', path: 'owner', ref: 'User' },
      { schema: 'Cat', path: 'toys.manufacturer', ref: 'Company' },
    ];
    (extractSchemaRefs as jest.Mock).mockReturnValueOnce(refs);

    service.register(new Schema({}), 'Cat');

    expect(service.getRefsForSchema('Cat')).toEqual([
      { path: 'owner', ref: 'User' },
      { path: 'toys.manufacturer', ref: 'Company' },
    ]);

    expect(service.getSchemasReferencing('User')).toEqual([
      { schema: 'Cat', path: 'owner', ref: 'User' },
    ]);

    expect(service.getSchemasReferencing('Company')).toEqual([
      { schema: 'Cat', path: 'toys.manufacturer', ref: 'Company' },
    ]);
  });

  it('should append entries across multiple register() calls', () => {
    (extractSchemaRefs as jest.Mock)
      .mockReturnValueOnce([
        { schema: 'Cat', path: 'owner', ref: 'User' },
        { schema: 'Cat', path: 'tags', ref: 'Tag' },
      ] satisfies SchemaRefInfo[])
      .mockReturnValueOnce([
        { schema: 'Dog', path: 'owner', ref: 'User' },
      ] satisfies SchemaRefInfo[]);

    service.register(new Schema({}), 'Cat');
    service.register(new Schema({}), 'Dog');

    expect(service.getRefsForSchema('Cat')).toEqual([
      { path: 'owner', ref: 'User' },
      { path: 'tags', ref: 'Tag' },
    ]);

    expect(service.getRefsForSchema('Dog')).toEqual([
      { path: 'owner', ref: 'User' },
    ]);

    // ref -> schemas should include both Cat and Dog entries for User
    expect(service.getSchemasReferencing('User')).toEqual([
      { schema: 'Cat', path: 'owner', ref: 'User' },
      { schema: 'Dog', path: 'owner', ref: 'User' },
    ]);

    expect(service.getSchemasReferencing('Tag')).toEqual([
      { schema: 'Cat', path: 'tags', ref: 'Tag' },
    ]);
  });

  it('should return empty arrays for unknown schema/ref keys', () => {
    expect(service.getRefsForSchema('UnknownSchema')).toEqual([]);
    expect(service.getSchemasReferencing('UnknownRef')).toEqual([]);
  });

  it('should use schemaName passed to register() when calling extractSchemaRefs', () => {
    (extractSchemaRefs as jest.Mock).mockReturnValueOnce([
      { schema: 'Cat', path: 'owner', ref: 'User' },
    ] satisfies SchemaRefInfo[]);

    const schema = new Schema({});
    service.register(schema, 'Cat');

    expect(extractSchemaRefs).toHaveBeenCalledWith(schema, 'Cat');
  });
});
