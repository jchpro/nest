# Nest.js auth utilities

Import from the `@jchpro/nest-common/auth` entry point.

## Installation

```shell
# Required peer dependencies
npm i bcrypt
# Main library, if not already installed
npm i @jchpro/nest-common
```

## Description

Some implementation-agnostic utilities for authorization mechanism plus password hashing and comparing using `bcrypt`.
They don't authenticate anybody: that is up to your strategy (Passport or anything else).

## Authorization

- `@Public()` decorator marks a controller or an endpoint as public (the metadata is read from the handler first, then the class)
- `PublicAccessAdvisorService` resolves `@Public` metadata and checks if a context is public
- `PermissionsGuard` lets public contexts through, and for others checks the permissions required by the handler and the controller (merged) using your `AuthorizationService`
- `AuthUserResolver` is a function returning the logged-in user from the request (usually `request => request.user`)
- `AuthorizationService<TUserEntity, TPermission>` is the interface you implement: `validateAuthorization(user, requiredPermissions)` returns `boolean` or a promise of it

### Setup

```typescript
@Module({
  imports: [
    AuthCoreModule.forStrategy(
      (request) => request.user,
      { serviceClass: MyAuthorizationService, forbiddenFactory: () => new ForbiddenException() },
      [UsersModule], // imports needed by the service class
    ),
  ],
  providers: [{ provide: APP_GUARD, useClass: PermissionsGuard }],
})
export class AuthModule {}
```

`AuthCoreModule.forStrategy(userResolver, options?, imports?)` provides `PublicAccessAdvisorService` and the user resolver
(`AUTH_USER_RESOLVER` token). When `options` is passed, the `serviceClass` is also exposed as the authorization service.
`PermissionsGuard` needs it, so pass the options if you use the guard. `forbiddenFactory` creates the exception thrown on denial
(without it the guard just returns `false`, which Nest turns into a `403`).

The guard does not authenticate: put it after your authentication guard. A user missing from the request counts as not authorized.

### Requiring permissions

Mark controllers and endpoints with the decorator returned by `RequireAuthorizationFactory` from `@jchpro/nest-common/openapi`
(it also adds a `403` response to the OpenAPI document):

```typescript
export const RequireAuthorization = RequireAuthorizationFactory<Permission>({ description: 'Missing permissions' });

@Get()
@RequireAuthorization(Permission.BOOKS_READ)
list() {}
```

## Auth utility

- `PasswordUtilityService` for hashing (`hash`) and comparing (`compare`) passwords using `bcrypt`
- `AuthUtilityModule` provides it, with `forRoot` (global), `forFeature`, `forRootAsync` and `forFeatureAsync`

```typescript
AuthUtilityModule.forRoot({ password: { saltOrRounds: 12 } }) // `saltOrRounds` defaults to 10
```
