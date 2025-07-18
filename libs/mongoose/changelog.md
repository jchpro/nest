# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-07-18

## Added

- `ResolveDocumentPipeFactory`
- Passing pipes to `MongoIdParam` produced by the factory.

## [0.5.0] - 2025-04-12

## Added

- Missing `commander` dependency
- Missing `.md` files in distribution code

### Changed

- Updated librarian dependency
- Adapted CLI options

## [0.4.1] - 2025-03-12

### Changed

- Fixed dependency versions

## [0.4.0] - 2025-03-12

### Changed

- Moved to Nest.js 11, adapted code

## [0.3.0] - 2024-11-13

### Added

- Decorator factories for `AppSchema` and `MongoIdParam`
- Services for typical CRUD queries, `QueryService` using `QueryExecutor`
- Various utility types

## [0.2.0] - 2024-03-17

### Added

- Support for non-monorepo workspace setup

## [0.1.1] - 2024-03-17

### Added

- Added missing peer dependencies for Mongoose

## [0.1.0] - 2024-03-16

### Added

- Initial implementation
- Migrate CLI, without any unit tests
- Readme and changelog
