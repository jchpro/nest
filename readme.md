# Nest.js libraries monorepo

`@jchpro/nest-*` libraries for Nest.js apps (Nest 12), published to npm.

## Libraries

- `@jchpro/nest-common` [Common parts for the Nest.js apps](/libs/common/readme.md)
- `@jchpro/nest-config` [Nest.js config loading utility](/libs/config/readme.md)
- `@jchpro/nest-i18n` [`nestjs-i18n` helpers (deferred validation messages)](/libs/i18n/readme.md)
- `@jchpro/nest-mongoose` [Utilities for Nest.js apps using Mongoose](/libs/mongoose/readme.md)

The [example app](apps/example-app/readme.md) (`apps/example-app`, private, never published) shows them working together.

The packages are ESM, built with plain `tsc` into `libs/*/dist`, and versioned and released independently
(see [releasing.md](releasing.md)). Each has its own `changelog.md`. Nest.js 12 only: the shared dependencies
(`@nestjs/*`, `class-validator`, ...) are peer dependencies.

## Development

Node.js 24 or newer (see `.nvmrc`); the packages declare `engines.node` `>=24`. The packages are npm workspaces under `libs/`, next to the example app under `apps/`.

```shell
npm ci
npm run type-check   # builds the libs first, then tsc --noEmit for each of them
npm run lint:check
npm test             # Vitest; builds the libs first
npm run build        # libs/*/dist, in dependency order
npm run verify:libs  # packs the tarballs and checks them in a clean temporary project
npm run start:example # builds everything and starts the example app (needs MongoDB, see its readme)
```

## Contributing

Please open an issue, so we can discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

LGPL-3.0-only (see the `license` field of each package).
