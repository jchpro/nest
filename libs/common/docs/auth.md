# Nest.js auth utilities

## Installation

```shell
# Required peer dependencies
npm i bcrypt
# Main library, if not already installed
npm i @jchpro/nest-common
```

## Description

Some implementation-agnostic utilities for authorization mechanism plus password hashing and comparing using `bcrypt`.

## Authorization

- `@Public` decorator marks context as public
- `PublicAccessAdvisorService` resolves `@Public` decorator metadata and checks if context is public
- `PermissionsGuard` taking into account contexts marked as public and using `AuthorizationService` to validate authorization
- `AuthUserResolver` to make the 

## Auth utility

- `PasswordUtilityService` for hashing and comparing password using `bcrypt`
