# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Unreleased

### Changed

- **Breaking:** the package is ESM only and ships compiled code from `dist/` (it can still be `require()`d). Only the entry points listed in `exports` can be imported, deep imports are not supported.
- **Breaking:** requires Nest.js 12. Dependencies that must be shared with the application (`@nestjs/*`, `class-validator`, `class-transformer`, ...) are now peer dependencies.
- No longer depends on `@jchpro/nest-librarian`. `@jchpro/nest-common` is now a peer dependency.
- The migration generator is the `mongo-migrate-create` command (replaces `mongo-migrate setup` / `generate`, see the docs).

### Added

- Soft delete plugin.
