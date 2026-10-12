# Schema references

## Description

Finds which Mongoose schemas reference which, so a document can be refused deletion while something still points at it
(a "restrict" delete rule). It works in a single-connection setup: every model of the default connection is inspected.

## Usage

Register the module once, after the models are registered:

```typescript
@Module({
  imports: [
    SingleConnectionSchemaRefsModule.forRoot({
      unrefAssertionErrorFactory: (id, infos) => new ConflictException(`Still referenced: ${infos.map(i => i.name).join(', ')}`),
    }),
  ],
})
export class AppModule {}
```

It is a global module, `forRootAsync({ useFactory, inject })` is available too. On startup it walks the schema of every model
and registers each `ref` it finds, including refs inside arrays, nested objects and subdocuments.
Options (`SingleConnectionSchemaRefsOptions`):

- `skipModels` - model names left out of the process
- `idField` - name of the ID field of the documents, `_id` by default
- `unrefAssertionErrorFactory(id, infos)` - creates the error thrown when a referenced document is found; a `ConflictException` listing the references is thrown by default

### Looking up the references

The module provides two services.

`SchemaReferencesService` knows the registered references:

- `getSchemasReferencing(name)` - the `SchemaRefInfo` entries (`{ schema, path, ref }`) of all schemas which reference the given model
- `getRefsForSchema(name)` - the `{ path, ref }` entries of the given model
- `register(schema, name)` - registers a schema by hand (done by the module for every model)

`ReferencingDocsLookupService` checks the database:

- `find(id, refs)` - which documents in the schemas of `refs` reference the ID (`ReferencingDocInfo[]`: `name`, `count`, `ids`)
- `assertUnreferenced(id, refs, errorFactory?)` - same, but throws when anything is found

Soft-deleted documents count as referencing, as they still hold their references, and restoring one must not leave a dangling reference.

```typescript
@Injectable()
export class UploadsService {
  private readonly externalRefs: SchemaRefInfo[];

  constructor(
    schemaRefs: SchemaReferencesService,
    private readonly lookup: ReferencingDocsLookupService,
  ) {
    this.externalRefs = schemaRefs.getSchemasReferencing(Upload.name);
  }

  async delete(upload: UploadDocument) {
    await this.lookup.assertUnreferenced(upload._id, this.externalRefs);
    await upload.deleteOne();
  }
}
```

`extractSchemaRefs(schema, name)` is the function doing the schema walk, if you need it on its own.
