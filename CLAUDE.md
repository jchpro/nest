# nest — working notes for Claude

Monorepo of the `@jchpro/nest-*` libraries (Nest.js 12), published to npm. Maintained solo by Jakub; the
libraries are reused by his apps (e.g. `jchpro/websites-api`) and by customer apps. See [readme.md](readme.md)
and [releasing.md](releasing.md).

## Layout

- `libs/` – npm workspaces, one package each: `common`, `config`, `i18n`, `mongoose` (`@jchpro/nest-<name>`). Every package has its own `package.json`, `tsconfig.json` (type-check, includes tests), `tsconfig.build.json` (build, excludes tests), `src/`, `readme.md` and `changelog.md`; `common` and `mongoose` also have `docs/`.
- `tsconfig.libs.json` – shared compiler options (ESM, `nodenext`, decorator metadata).
- `scripts/` – `verify-libs.mjs`, `check-versions.mjs`, `release.mjs` (+ `lib/libs.mjs`, the list of packages).
- `.github/workflows/` – `pull_request.yaml` and one `publish-<lib>.yaml` per package.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install dependencies (Node 24, see `.nvmrc`) |
| `npm run build` | Builds the libs into `libs/*/dist` with plain `tsc`, in the order of the `workspaces` list (`common` before `mongoose`) |
| `npm run type-check` | Builds the libs, then `tsc --noEmit` for each (tests included) |
| `npm run lint:check` | ESLint without autofix (use this, not `npm run lint`, which has `--fix`) |
| `npm test` | Unit tests (Vitest, `libs/*/src/**/*.test.ts`); builds the libs first, needs no services |
| `npm run verify:libs` | Packs the tarballs and checks them in a clean temporary project (ESM + `require`, optional peers, type declarations, the bin) |
| `npm run check:versions` | `package.json` vs changelog vs peer ranges between our own packages |
| `npm run release -- <command>` | Release helper, see [releasing.md](releasing.md) |

Before finishing a change, run `type-check`, `lint:check`, `test` and, when package metadata, `exports`, peers or `files` changed, `verify:libs`.

## Libraries

- Keep them app-agnostic: nothing specific to one app belongs here.
- Consumers import from the package name, never from `libs/` paths or via path aliases. Only the entry points listed in a package's `exports` exist; deep imports are not supported.
- Relative imports inside a lib need the `.js` extension (ESM, `nodenext`).
- `mongoose` is CommonJS: import it as a default (`import mongoose from 'mongoose'`) or with `import type`, never `import { Types } from 'mongoose'`.
- Use plain top-level imports. Do not reintroduce the old "dynamic `require` + existence check" pattern; optional dependencies are optional *peers* behind their own entry point (`@nestjs/swagger`, `@nestjs/throttler`, `bcrypt`, `morgan` in `common`).
- Nest 12 only: the peer dependencies are `^12.0.0`. Don't add compatibility code for older Nest versions.
- Everything the libs declare as peers (or import in tests) is also a dev dependency of the root `package.json`; keep both in sync when a lib gains a dependency, and extend `verify-libs.mjs` when it gains an optional peer or an entry point that needs one.
- Match the surrounding code's style, comment density and naming. Prettier config is in `.prettierrc`.

## Testing

- Unit tests live next to the code (`*.test.ts`). Import from `vitest` explicitly (`globals: false`).
- Vitest runs the tests through the SWC plugin (`unplugin-swc`) so `emitDecoratorMetadata` works for Nest's DI.
- `mongoose` tests import `@jchpro/nest-common` from its built `dist/`, hence `npm test` builds the libs first.

## Versioning and releasing

- Packages are versioned and released independently, tags are `<lib>-vX.Y.Z` (`common`, `config`, `i18n`, `mongoose`). Full guide in [releasing.md](releasing.md).
- **Changelog**: accumulate everything under one `## [X.Y.Z] - Unreleased` heading per package; don't bump `version` or add dated entries while working. The version is only set at release time (`npm run release -- prepare|ship`).
- Breaking changes need a major bump. <!-- REVIEW: ng allows breaking changes in minors because it is pre-1.0; here the packages are 1.0.0, so I assumed strict semver -->
- Publish order: `common` before the packages that depend on it (`mongoose`).
- The npm trusted publisher of each package is bound to its workflow *file name* (`publish-<lib>.yaml`): never rename those files. Publish workflows run on a tag only, deliberately without `workflow_dispatch`, and use OIDC (no `NPM_TOKEN`).
- Never publish, tag/push release tags, or run `npm publish` / `npm deprecate` / anything else that changes the npm registry or account unless asked explicitly. `release.mjs` may only be run with `--dry-run` unless asked.

## Safety rules

- `.env` and `.ai.env` are gitignored and never committed. Don't print or commit secrets or tokens.
- Stop any server or background process you started for testing before you finish.

## Git workflow

- `main` is the only long-lived branch and must stay green; don't push to it directly.
- Work on a short-lived branch per change (`feat/...`, `fix/...`, `chore/...`), commit in small logical steps, open a PR against `main` when the work is ready.
- The owner reviews and merges PRs. Don't merge or enable auto-merge unless asked.
- The owner may push docs-only changes (readmes, changelogs, `CLAUDE.md`) straight to `main` with the branch-protection bypass; don't do that yourself unless asked. Code and CI changes always go through a PR.
