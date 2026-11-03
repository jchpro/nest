# nest — working notes for Claude

Monorepo of the `@jchpro/nest-*` libraries (Nest.js 12), published to npm. Maintained solo by Jakub; the
libraries are reused by his apps (e.g. `jchpro/websites-api`) and by customer apps. See [readme.md](readme.md)
and [releasing.md](releasing.md).

## Layout

- `libs/` – npm workspaces, one package each: `common`, `config`, `i18n`, `mongoose` (`@jchpro/nest-<name>`). Every package has its own `package.json`, `tsconfig.json` (type-check, includes tests), `tsconfig.build.json` (build, excludes tests), `src/`, `readme.md` and `changelog.md`; `common` and `mongoose` also have `docs/`.
- `apps/example-app` – private workspace (`"private": true`, never published, ignored by the release tooling): a small cats and owners app using the libs by package name from their built `dist/`. See its [readme](apps/example-app/readme.md). It builds in CI (type-check + build, no database there); keep it working when a lib's API changes.
- `e2e/` – private workspace (never published, ignored by the release tooling): end-to-end tests, see [e2e/readme.md](e2e/readme.md). Each scenario boots a throwaway Nest app with the built libs and talks to it over HTTP; MongoDB is an in-memory replica set (`mongodb-memory-server`).
- `tsconfig.libs.json` – shared compiler options (ESM, `nodenext`, decorator metadata).
- `scripts/` – `verify-libs.mjs`, `check-versions.mjs`, `release.mjs` (+ `lib/libs.mjs`, the list of packages).
- `.github/workflows/` – `pull_request.yaml`, one `publish-<lib>.yaml` per package, and `warm-mongodb-cache.yaml` (saves the `mongod` binary cache of the e2e job on `main`, because a pull request can't share its caches with others).

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install dependencies (Node 24, see `.nvmrc`) |
| `npm run build` | Builds the libs into `libs/*/dist` with plain `tsc`, in the order of the `workspaces` list (`common` before `mongoose`) |
| `npm run type-check` | Builds the libs, then `tsc --noEmit` for each (tests included) |
| `npm run lint:check` | ESLint without autofix (use this, not `npm run lint`, which has `--fix`) |
| `npm test` | Unit tests (Vitest, `libs/*/src/**/*.test.ts`); builds the libs first, needs no services |
| `npm run test:e2e` | End-to-end tests (Vitest + supertest, `e2e/`); builds the libs first, needs no services (the first run downloads a `mongod` binary of ~210 MB to `~/.cache/mongodb-binaries`) |
| `npm run start:example` | Builds libs and the example app and starts it; needs MongoDB (replica set), `apps/example-app/.env` and `docker compose up -d --wait` there |
| `npm run verify:libs` | Packs the tarballs and checks them in a clean temporary project (ESM + `require`, optional peers, type declarations, the bin) |
| `npm run check:versions` | `package.json` vs changelog vs peer ranges between our own packages |
| `npm run release -- <command>` | Release helper, see [releasing.md](releasing.md) |

Before finishing a change, run `type-check`, `lint:check`, `test`, `test:e2e` (when a lib's behavior changed) and, when package metadata, `exports`, peers or `files` changed, `verify:libs`.

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
- E2E tests (`e2e/tests/*.e2e.test.ts`) are for behavior across a real HTTP app and a real MongoDB; keep the unit tests for the logic. Each test file builds its own app (`createApp`) and uses its own database (`uniqueDatabaseUri`). A known bug is recorded as `it.fails(...)` with a link to its issue, and the `.fails` is removed in the PR which fixes it.

## Versioning and releasing

- Packages are versioned and released independently, tags are `<lib>-vX.Y.Z` (`common`, `config`, `i18n`, `mongoose`). Full guide in [releasing.md](releasing.md).
- **Changelog**: accumulate everything under one `## [X.Y.Z] - Unreleased` heading per package; don't bump `version` or add dated entries while working. The version is only set at release time (`npm run release -- prepare|ship`).
- Breaking changes need a major bump.
- Publish order: `common` before the packages that depend on it (`mongoose`).
- The npm trusted publisher of each package is bound to its workflow *file name* (`publish-<lib>.yaml`): never rename those files. Publish workflows run on a tag only, deliberately without `workflow_dispatch`, and use OIDC (no `NPM_TOKEN`).
- Never publish, tag/push release tags, or run `npm publish` / `npm deprecate` / anything else that changes the npm registry or account unless asked explicitly. `release.mjs` may only be run with `--dry-run` unless asked.

<!-- overseer:begin id=nest hash=17efe828 -->
<!-- Managed by the overseer repo. Do not edit between the markers; change the rules there. -->

## CI and Actions minutes

The account's free Actions minutes are limited. Private repos spend them; public repos are exempt.

- Private repos run CI on pull requests, not on pushes to the default branch, and not on `develop` pushes. A weekly scheduled run is fine.
- Skip docs-only changes (`paths-ignore`) and cancel superseded runs (`concurrency`).
- Batch work into fewer pull requests, and run lint, type-check, tests and the build locally before pushing.
- A repo that deviates from this says why in its CLAUDE.md.

## Git

- Work on a branch. Never push to the default branch unless asked.
- Commit on your branch without asking: small commits, one concern each, with a short, to-the-point message. Reference the issue (`#123`) when there is one. Push only when asked.
- Opening a PR needs a yes in the current session. Never merge and never enable auto-merge unless asked.
- Never force-push (branches or tags) unless explicitly asked in the current session. Never rewrite shared history.
- Check `git status` before committing; do not commit unrelated changes or secrets.
- Deploys, releases and publishing happen through GitHub Actions, and only when asked.

## Issues and other repos

- Work is tracked in GitHub issues; open work does not live in CLAUDE.md or TODO files. Reference the issue in commits and PRs.
- Ask before creating an issue.
- Do not change other repos from here; read them only to look things up. A change needed elsewhere (library change, deploy, infra) becomes an issue there, drafted for the owner to approve.
- Use labels `overseer:blocked`, `overseer:needs-release`, `overseer:needs-deploy` to signal cross-repo state.
- Cross-repo dependencies go in the issue body as a fenced YAML block (`depends-on: owner/repo#12`, `next: deploy`).

## Language

- Chat, code, comments, commits and issues are in English.
- User-facing text follows each app's own languages, which may be one or several.

## Privacy and secrets

- Never commit, log or paste secrets, tokens, keys or `.env` contents. Real values live in the password manager or on the server.
- Real user or customer data may exist only as a local copy, never the live system. Never commit it, never put it in tracked fixtures, issues, PRs, commits or logs, and never point dev or test at production. You may run against the copy but must not dump or quote records in the session; use counts, shapes or invented examples.
- A customer may be referred to by first name only.
- Use anonymised sample data in tests and fixtures.

## Servers and background processes

- A server or process you started for your own checks: stop it before you finish.
- One the owner asked you to start: leave it running until told to stop, and say what is running (what and which port) when you finish a task.

## Quality

- Run the repo's tests and linter before saying work is done; report failures plainly instead of hiding them.
- Match the surrounding code's style, naming and comment density.
- Keep changes scoped to what was asked. Mention, but do not silently fix, unrelated problems.

## Context: library

Public libraries consumed by other repos (e.g. Nest and Angular libs).

- Semver. From 1.0 a breaking change is a major bump, with a migration note in the changelog. Before 1.0 a breaking change may be a minor.
- Every user-facing change needs a changelog entry and an updated README/docs. When the version is bumped (with the change, or at release) is the repo's own convention, written in its CLAUDE.md; follow it.
- Never publish, tag or release unless explicitly asked in the session. Releases are cut deliberately (owner confirms).
- Publishing is done by Actions (tag-triggered, npm trusted publishing), not from a laptop. A repo that publishes differently records the exception and its reason in the registry.
- Before a breaking change, check `uses:` in the registry for consumers and open a bump issue in each (ask first, as for any issue).
- Nothing private, internal or customer-related in what gets published (package contents, docs, changelog) or in a public repo's code, issues and commits.
- After a release, dependent repos get a bump issue (labels: `overseer:needs-release` on the lib until published).

<!-- overseer:end -->

## Repo-specific rules

- `.env` and `.ai.env` are gitignored and never committed.
- `main` is the only long-lived branch and must stay green. Branch names: `feat/...`, `fix/...`, `chore/...`.
- Public library: when the work is ready, open the PR against `main` (this repo's standing exception to "opening a PR needs a yes"). The owner reviews and merges it.
- The owner may push docs-only changes (readmes, changelogs, `CLAUDE.md`) straight to `main` with the branch-protection bypass; don't do that yourself unless asked. Code and CI changes always go through a PR.
