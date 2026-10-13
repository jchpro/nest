# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - Unreleased

### Fixed

- `CrudOptions.maxLimit` applies also when a query has no `limit`, it only capped a requested limit so far: with `maxLimit: 25`, listing without a `limit` returned everything. If you rely on the unlimited default, request the limit explicitly or don't set `maxLimit`.
- `QueryResult.offset` and `QueryResult.limit` returned by `QueryExecutor` were swapped, and now hold the offset and the (capped) limit of the query.
- The migration lock is atomic: instances starting at the same time could both take it and run the same migrations twice. Acquiring it is now one upsert guarded by a unique index (created by `Migrator` itself, so it works with `autoIndex` off), and an instance releases only the lock it holds. The lock document of an earlier version gets a `key` and is used as it is, so a rolling deploy with older instances keeps working. The lock collection gets a new unique partial index on `key`.

## [2.0.0] - 2026-10-13

### Changed

- **Breaking:** `Migrator.up()` rethrows the error when a migration fails (it was only logged), so the application can react, e.g. refuse to start. The changelog lock is still released.

### Fixed

- `TransformMongoIdFactory` and `TransformMongoIdOptions` are exported from the package entry point (documented, but were missing from the barrel).
- `mongo-migrate-create` writes the imports of the collector file with the `.js` extension, which ESM projects (`nodenext`) require. Regenerate the collector (create a migration) to get the new form; the old form keeps working in the setups it worked in.

## [1.0.0] - 2026-10-13

### Changed

- **Breaking:** the package is ESM only and ships compiled code from `dist/` (it can still be `require()`d). Only the entry points listed in `exports` can be imported, deep imports are not supported.
- **Breaking:** requires Nest.js 12. Dependencies that must be shared with the application (`@nestjs/*`, `class-validator`, `class-transformer`, ...) are now peer dependencies.
- No longer depends on `@jchpro/nest-librarian`. `@jchpro/nest-common` is now a peer dependency.
- The migration generator is the `mongo-migrate-create` command (replaces `mongo-migrate setup` / `generate`, see the docs).

### Added

- Soft delete plugin.
