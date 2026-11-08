# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-08

### Added

- Peer range of `class-validator` is `^0.14.3 || ^0.15.0`. class-validator 0.15 changes the signature of `@IsIBAN` (it takes an options argument), so check your usage if you validate IBANs.

## [1.0.0] - 2026-10-13

### Changed

- **Breaking:** the package is ESM only and ships compiled code from `dist/` (it can still be `require()`d). Only the entry points listed in `exports` can be imported, deep imports are not supported.
- **Breaking:** requires Nest.js 12. Dependencies that must be shared with the application (`@nestjs/*`, `class-validator`, `class-transformer`, ...) are now peer dependencies.

### Added

- First release of the package: `I18nMessage`, `I18nDefer` and `translateI18MessageErrors`, previously internal to the API.
