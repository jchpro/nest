# Utilities for Mongoose

## Description

## Decorators

- `@AppSchema` - returned by a factory function, lets you set some defaults which will be applied for each schema
- `@MongoIdParam` - returned by a factory function, will validate Mongo ID parameter and throw any error you wish
- `@TransformMongoId` - returned by a factory function, will transform Mongo ID to a string with `class-transformer`

## Queries

- `QueryExecutor` - holds the query data (`QueryData` of `@jchpro/nest-common`: offset, limit, sorting) and executes it for a given Mongoose model, returning a `QueryResult`
- `QueryService` - prepares a `QueryExecutor` passing global config (`prepare()`), or runs it right away (`execute()`). Besides the model and the data it takes an optional `FilterQueryProvider` (an object with `getFilters()`, e.g. a query DTO), a projection and other Mongoose query options (`OtherQueryOptions`)
- `MongooseCrudModule` provides `QueryService`, with `forRoot` (global), `forFeature`, `forRootAsync` and `forFeatureAsync`. `CrudOptions.maxLimit` is the maximum page size: it caps the requested `limit`, and applies when no `limit` is requested

```typescript
MongooseCrudModule.forRoot({ maxLimit: 25 })

// in a service
return this.queryService.execute(this.model, queryData, filtersProvider);
```

## Transactions

`TransactionalService` is a base class (its constructor takes a Mongoose `Connection`) with `transactional(callback)`, which runs the callback inside a
session transaction. The queries in the callback must receive the session (`{ session }` or `.session(session)`), otherwise they are not part of the transaction.
Transactions need a replica set.

```typescript
@Injectable()
export class BooksService extends TransactionalService {
  constructor(@InjectConnection() connection: Connection) {
    super(connection);
  }

  async move() {
    await this.transactional(async session => {
      await this.model.updateOne(filter, update, { session });
    });
  }
}
```

## Polymorphic schemas

`PolymorphicSchema<T>(discriminator, BaseClass)` is the Mongoose counterpart of `PolymorphismHelper` from `@jchpro/nest-common`.
Each `register(value, SubClass)` creates the sub schema with `SchemaFactory.createForClass` and adds it as a discriminator of the base schema,
which is available as `.schema`.

```typescript
const MetadataPolymorphic = new PolymorphicSchema<MetadataType>('type', Metadata);
MetadataPolymorphic.register(MetadataType.IMAGE, ImageMetadata);
MetadataPolymorphic.register(MetadataType.VIDEO, VideoMetadata);

export const MetadataSchema = MetadataPolymorphic.schema;
```

## Schema references

To find what references a document before deleting it, see [Schema references](./schema-references.md).

## Various types

Mostly CRUD related.

- `IdentifiableSchema` - a schema with an `_id: Types.ObjectId`
- `SoftDeletableSchema` - a schema using the soft delete plugin (below)
- `EntityDto<T>` - `T` with `_id` turned into a string, the shape of a serialized document
- `FilterQueryProvider` and `CrudOptions` - see "Queries"
- `TransformMongoIdOptions` - options of `TransformMongoIdFactory`: `documentIdField` (`_id` by default) is the name of the ID field of a populated document

## Soft deletes

`softDeletePlugin` makes soft deletes opt-in per schema:

```ts
export const GardenProjectSchema = SchemaFactory.createForClass(GardenProject);
GardenProjectSchema.plugin(softDeletePlugin, { purgeAfterDays: 30 }); // option is optional
```

- Adds an optional `deletedAt` date (absent means live; declare it with `SoftDeletableSchema`). No migration is needed for existing data.
- Soft-deleted documents are hidden from `find*`, `count*`, `distinct`, `update*`, `replaceOne` and `aggregate` (a `$match` is prepended, so `$geoNear` as the first stage is not supported).
  Pass `{ withDeleted: true }` or `{ onlyDeleted: true }` as query options (`.setOptions(...)`) or aggregate options to opt out.
  A query whose filter already mentions `deletedAt` is left alone. `QueryExecutor` forwards these options to its count query, so pass them via `other`.
- `doc.softDelete({ session?, deletedAt? })`, `doc.restore()` and the statics `softDeleteOne/Many`, `restoreOne/Many` (type the model as `SoftDeleteModel<TDoc>`).
  Share one `deletedAt` between related schemas and pass it to `restore*` to bring back only what was deleted together.
- `deleteOne`, `deleteMany` and `findOneAndDelete` stay physical, so they act as "purge". Restoring and purging need `onlyDeleted`/`withDeleted` to find the document.
- `purgeAfterDays` adds a TTL index on `deletedAt`: MongoDB removes the document without any hooks, so related data needs the same TTL. The TTL is fixed once the index exists, change it with `collMod`.
- Not covered: `bulkWrite`, `insertMany`, `$lookup` into other collections. `populate` of a soft-deleted reference yields `null`.
- Unique indexes need `partialFilterExpression: { deletedAt: { $exists: false } }` to let a deleted document's value be reused.
