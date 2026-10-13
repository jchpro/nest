# Example app

A small Nest.js app (cats and their owners) showing the `@jchpro/nest-*` libraries working together. It is a private
workspace of this repo: it imports the libraries by package name, from their built `dist/`, like a real app would, and it is never published.

## Run it

You need Node.js 24, Docker and the dependencies installed (`npm ci` in the repo root).

```shell
cd apps/example-app
cp .env.example .env
docker compose up -d --wait   # MongoDB 8 as a single-node replica set, transactions need one
cd ../..
npm run start:example         # builds the libraries and the app, then starts it
```

Swagger UI is at <http://localhost:3000/docs> (the JSON document at `/docs/doc.json`).

- Already have a MongoDB on port 27017? Set `MONGO_PORT` for docker compose (e.g. `MONGO_PORT=27018 docker compose up -d --wait`)
  and put the same port in `MONGODB_URI`. Keep `directConnection=true` in the URI. Any replica set works, transactions fail on a standalone server.
- `docker compose down -v` stops the database and removes its data.

## What to try

The read endpoints are public. The write endpoints need a demo user: in Swagger UI click "Authorize" and enter `admin`
(all permissions) or `cat-sitter` (can only write cats), or send it as the `X-Demo-User` header. There is no real authentication.

1. `POST /owners` as `admin`, then `POST /cats` with the owner's ID: `catsCount` of the owner goes up (one transaction).
2. `GET /cats?breed=bengal&sortBy=name&limit=10`: filters, sorting and pagination, the total is in the `X-Total-Count` header.
3. `DELETE /owners/{id}` while the owner has cats: `409 Conflict`. Soft-deleting the cats is not enough, a soft-deleted cat still references its owner.
4. `DELETE /cats/{id}` soft-deletes a cat, `GET /cats?deleted=true` lists the soft-deleted ones, `POST /cats/{id}/restore` brings one back.
5. `POST /owners/{id}/transfer-cats` moves the cats to another owner (a transaction touching three documents). It is on the `strict` throttling tier, so
   calling it twice in 10 seconds gives `429 Too Many Requests`.
6. Try `POST /owners` as `cat-sitter`, or without a user: `403 Forbidden`.

## Where each feature is used

| Feature | Library | Where |
|---|---|---|
| Validated env class, `ConfigResolver` | config | [app.config.ts](src/app.config.ts), `ConfigModule.forRoot` in [app.module.ts](src/app.module.ts), [main.ts](src/main.ts) |
| `RequestLoggerFormat` passed to `IsEnum` | common | [app.config.ts](src/app.config.ts) |
| `LoggerFactory`, `RequestLoggerFactory`, `GlobalExceptionHandler`, `SwaggerUiFactory` | common | [main.ts](src/main.ts) |
| `AppSchema`, `MongoIdParam`, `TransformMongoId` factories | mongoose | [shared/app-schema.ts](src/shared/app-schema.ts), [shared/to-dto.ts](src/shared/to-dto.ts) |
| `MongooseCrudModule`, `QueryService`, pagination and sorting DTOs, `@ApiQueryResultResponse` | mongoose, common | [app.module.ts](src/app.module.ts), [cats/cat.dto.ts](src/cats/cat.dto.ts), [cats/cats.service.ts](src/cats/cats.service.ts), [cats/cats.controller.ts](src/cats/cats.controller.ts) |
| `@ApiEnum` and `reusableApiEnum` | common | [cats/cat-breed.ts](src/cats/cat-breed.ts), [cats/cat.dto.ts](src/cats/cat.dto.ts) |
| `ValidateFactory`, `@ApiSelfTag` | common | [shared/validate.ts](src/shared/validate.ts), the controllers |
| Soft delete plugin | mongoose | [cats/cat.schema.ts](src/cats/cat.schema.ts), [cats/cats.service.ts](src/cats/cats.service.ts) |
| `SingleConnectionSchemaRefsModule`, `ReferencingDocsLookupService` | mongoose | [app.module.ts](src/app.module.ts), [owners/owners.service.ts](src/owners/owners.service.ts) |
| `TransactionalService` | mongoose | [cats/cats.service.ts](src/cats/cats.service.ts) |
| Throttling tiers | common | `ThrottlerModule` in [app.module.ts](src/app.module.ts), the decorators in the controllers |
| `@Public`, `PermissionsGuard`, `RequireAuthorizationFactory`, user resolver | common | [auth/](src/auth), the controllers |
| Migrations: `mongo-migrate-create`, `MongoMigrateModule`, `Migrator` | mongoose | [app.migrations.ts](src/app.migrations.ts), [migrations/](src/migrations), [main.ts](src/main.ts) |

## Adding a migration

```shell
npm run create-migration -w @jchpro/nest-example-app
```

It asks for a name, creates the file in `src/migrations` and regenerates `src/app.migrations.ts`. The migrations run on startup, once each.

## Not covered

`@jchpro/nest-i18n`, real authentication (the demo user stands in for it), publishing the app.
