# Releasing the libraries

`@jchpro/nest-common`, `-config`, `-i18n` and `-mongoose` are versioned and published independently. A
release is a PR that bumps the version, then a tag that makes GitHub Actions publish to npm. Tags are
`common-vX.Y.Z`, `config-vX.Y.Z`, `i18n-vX.Y.Z` and `mongoose-vX.Y.Z`.

## The quick way (needs `gh`)

With the [GitHub CLI](https://cli.github.com/) installed and logged in, one command does steps 2 to 7
below, after you have picked the version and written its `## [X.Y.Z] - Unreleased` changelog
heading (step 1):

```bash
npm run release -- ship <common|config|i18n|mongoose> <X.Y.Z>
```

It prepares the release on a `release/<lib>-X.Y.Z` branch, pushes it and opens the PR with the
changelog entry as its description, waits for the PR's checks, squash-merges it, tags the merge
commit, **asks before pushing the tag**, and then watches the publish run until it finishes.
Nothing is merged unless the checks pass, and it never uses the `main` bypass.

It is also available in two halves, and `finish` can be re-run any time after an interruption, a
failed check (fix it on the branch, push, run it again) or a "no" at the prompt:

```bash
npm run release -- start  <lib> <X.Y.Z>   # branch, prepare, push, open the PR
npm run release -- finish <lib> [X.Y.Z]   # wait for checks, merge, tag, push the tag, watch the publish
```

`finish` takes the version from the release branch you are on, or from `package.json` on `main`
after the merge. Flags: `--yes` skips the prompt before pushing the tag, `--dry-run` checks the
preconditions and prints what would happen. Releasing several packages: [see below](#releasing-several-packages).

## Manual steps

The same flow by hand, without `gh`:

1. **Pick the version** and make sure the package's changelog (`libs/<lib>/changelog.md`) has a
   `## [X.Y.Z] - Unreleased` heading on top, holding everything since the last release. Work accumulates
   under that one heading; the version number is only chosen at release time.
2. **Prepare it**, from a clean working tree, on a branch:
   ```bash
   npm run release -- prepare <lib> <X.Y.Z>
   ```
   This sets `version` in the package's `package.json` and dates the changelog heading. It also moves the
   range other packages declare on it to `^X.Y.Z` (today only `mongoose` has one, on `common`).
3. **Review `git diff`, commit and open a PR.** The PR check
   ([pull_request.yaml](.github/workflows/pull_request.yaml)) runs `npm run check:versions`, which fails on
   drift between `package.json`, the changelog and the peer ranges between our own packages, then type-check,
   lint, tests, build, `verify:libs` and the audit.
4. **Merge the PR.** A release never needs the `main` bypass.
5. **Tag**, on an up-to-date `main`:
   ```bash
   git checkout main && git pull
   npm run release -- tag <lib>
   ```
   It refuses unless the tree is clean, you are on `main` at `origin/main`, the changelog entry is
   dated and the tag doesn't exist yet. It creates an annotated tag and **does not push it**.
6. **Push the tag**, which starts the publish:
   ```bash
   git push origin <lib>-vX.Y.Z
   ```
7. **Watch the run** in the Actions tab (`.github/workflows/publish-<lib>.yaml`), then check the new
   version on npmjs.com.

### Releasing several packages

Publish **`common` first**: release it end to end (steps 1 to 7), then the packages that depend on it
(`mongoose`). The published `mongoose`'s peer range points at the `common` version on npm, which has to
exist by then. `config` and `i18n` are independent of the others.

## What the publish workflow does

On a `<lib>-v*` tag only (there is deliberately no `workflow_dispatch`, so a branch can never publish):

1. Installs with `npm ci` on the Node version from `.nvmrc` and upgrades npm (OIDC publishing needs
   npm 11.5.1 or later).
2. `node scripts/check-versions.mjs --tag <tag>`: the tag must equal the package's `package.json`
   version, its changelog entry must be dated, not `Unreleased`, and its peer ranges on our own
   packages must be satisfied.
3. Builds all libraries (plain `tsc`, `common` before `mongoose`), runs the package's tests and
   `verify:libs`.
4. `npm publish --access public` from `libs/<lib>`, with **npm OIDC trusted publishing**: no
   `NPM_TOKEN`, `id-token: write` on the job, provenance attached automatically.

If a run fails, fix the cause and **re-run the job** from the Actions tab. If the tag itself was
wrong (before anything was published), delete it locally and on the remote, fix, and tag again.
A version already on npm can't be reused, so bump the patch instead.

## One-time setup (npmjs.com)

Each package has a **trusted publisher** configured on npmjs.com (package settings, Trusted
Publisher): GitHub Actions, repository `jchpro/nest`, and the workflow **file name**
(`publish-common.yaml`, `publish-config.yaml`, `publish-i18n.yaml`, `publish-mongoose.yaml`). Consequences:

- **Don't rename the workflow files.** The binding is to the file name, so publishing from a
  renamed file stops working until the trusted publisher is updated on npmjs.com.
- A new package needs the same setup. A trusted publisher is configured on an existing package,
  so its very first publish likely has to be done by hand (`@jchpro/nest-i18n` is in this situation).
- There must be no `NPM_TOKEN` repo secret: publishing is by OIDC alone.
