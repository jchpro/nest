# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-03-12

### Changed

- Bumped dependencies, added `@types/semver`

## [0.2.2] - 2024-11-13

### Changed

- Fixed bug which didn't allow de-aliasing dependency libraries if there was more than one

## [0.2.1] - 2024-03-17

### Changed

- Adapted Nest project type, `projects` can be undefined

## [0.2.0] - 2024-03-16

### Added

- Handling of library cross-referencing after the build
- `readDirFiles` utility function

### Changed

- Simplified `fs/promises` mocking in unit tests

## [0.1.0] - 2024-01-20

### Added

- Initial implementation
- Unit tests for exported components
- Readme and changelog
