# Nest librarian

Helps with preparing built Nest.js libraries for publishing, very simple stuff.

## Description

The CLI is a simple wrapper around Nest's build command, performing some common additional post-build steps.

Exported components might help you with building your own Nest CLIs.

## Installation

```shell
npm i -D @jchpro/nest-librarian
```

I'm not a fan of installing too many CLIs globally, so in this document I'll be showing example commands run using `npx`, assuming that the package is installed locally in your project.

## CLI usage

### `package.lib.json`

Put this in your library root if you want to build the library using the CLI. The schema is the one of `package.json`, the name is changed in order to not confuse your IDE.

The file will serve as the base for creating output `package.json`. Whatever you put there will be present in the output file, with some caveats which will be described below.

### Building libraries

```shell
npx nestlib build <libraryProject> <options...> 
```

Running `npx nestlib help build` will give you more information about the options, here's what the command does:

1. Builds the library using nest CLI;
2. Copies assets to the output library;
3. Merges paths from the root `package.json` to the output one;
4. Creates output `package.json`, reads dependency versions from the root one if that's what you want (described below);
5. Deletes the `tsbuildinfo` file.

#### Reading dependency versions from root

If you'd like the dependency versions to be read from the root `package.json`, just set them to `0.0.0` in the `package.lib.json`:

```json
{
  "dependencies": {
    "lodash": "0.0.0",
    "commander": "^13.1.0"
  }
}
```

In this example `lodash` will use the version from root, and `commander` will have `^13.1.0`.

## Exported components

Please refer to the code comments for additional information.

### `Library`

Represents the library defined in the `nest-cli.json` file. Contains paths to significant files and some parsed configuration.

### `Project`

Wrapper around `nest-cli.json` file, focusing on the libraries defined in the file. Contains instances of `Library` for each library in your workspace. 

### Utilities

There are few filesystem and other utilities available, once again - please refer to the code :)
