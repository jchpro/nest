# End-to-end tests

Tests of the `@jchpro/nest-*` libraries as an app uses them: each scenario boots a small Nest app inside the test file, built from the
**built libraries** (`libs/*/dist`, imported by package name) and talks to it over HTTP with `supertest`. The unit tests next to the code
cover the logic, these cover the behavior of the whole thing against a real Express server and a real MongoDB. It is a private workspace,
never published.

```shell
npm run test:e2e   # builds the libraries first
```

## MongoDB

`mongodb-memory-server` starts one single-node **replica set** (transactions need one) for the whole run, see [global-setup.ts](global-setup.ts).
Every test file uses a database of its own (`uniqueDatabaseUri()` in [tests/helpers/mongo.ts](tests/helpers/mongo.ts)), so files can run in parallel.

The first run downloads a `mongod` binary of about 210 MB to `~/.cache/mongodb-binaries` (`MONGOMS_DOWNLOAD_DIR` changes it). It is not downloaded
by `npm ci` (`allowScripts` of the root `package.json` turns the postinstall of the package off). CI caches the directory, keyed on the version
of `mongodb-memory-server-core`.

## Writing a scenario

- File name `tests/<topic>.e2e.test.ts`. Import from `vitest` explicitly.
- `createApp({ imports, controllers, ... }, setup?)` ([tests/helpers/app.ts](tests/helpers/app.ts)) builds the app and returns `{ app, http }`. The optional `setup`
  runs before `init`, where `main.ts` of a real app does its bootstrapping (exception handler, Swagger UI, proxy settings...). Close the app after the tests.
- Don't share one app between test files, and don't put app code in shared helpers: a scenario should read top to bottom.
- A known bug is written down as `it.fails('what should happen', ...)` with a comment linking its issue. The test starts failing when the bug is
  fixed, which is the reminder to remove the `.fails`.

## What is covered

| Test file | Library | Scenarios |
|---|---|---|
| `exception-handler` | common | response shape for `HttpException` and unknown errors, production and development mode |
| `auth` | common | `@Public`, `PermissionsGuard`, `RequireAuthorizationFactory`, no user |
| `throttling` | common | tiers, `429` and the `RateLimit-*` headers, `@ThrottleLogin` per IP and per e-mail, per-user limits |
| `openapi` | common | `@ApiQueryResultResponse` (items, `X-Total-Count`), Swagger UI and `doc.json` |
| `migrator` | mongoose | runs once, the lock, changelog mismatch, a failing migration, collection names |
| `soft-delete` | mongoose | hiding, `onlyDeleted` / `withDeleted`, restore, purge, shared `deletedAt`, TTL index |
| `query-service` | mongoose | pagination, sorting, filters, `maxLimit` |
| `schema-refs` | mongoose | `assertUnreferenced`, nested references, soft-deleted references, error factory, `skipModels` |
| `transactional` | mongoose | commit, rollback, writes without the session |
| `config` | config | loading from the environment and an env file, validation failures, `errorFactory` |

`i18n` is out of scope: it only helps with deferred validation messages.
