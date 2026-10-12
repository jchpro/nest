# Utilities for Mongoose

## Description

## Decorators

- `@AppSchema` - returned by a factory function, lets you set some defaults which will be applied for each schema
- `@MongoIdParam` - returned by a factory function, will validate Mongo ID parameter and throw any error you wish
- `@TransformMongoId` - returned by a factory function, will transform Mongo ID to a string with `class-transformer`

## Queries

- `QueryExecutor` - holds the query data and executes it for a given Mongoose model
- `QueryService` - prepares `QueryExectuor` passing global config

## Various types

Mostly CRUD related.

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
