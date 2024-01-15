#!/usr/bin/env node

import { Command } from 'commander';
import { build } from './cli/build';
import { NEST_FILE } from './consts';

// Program
const program = new Command()
  .name('@jchpro/nest-librarian')
  .description('CLI utility for preparing Nest.js libraries for publishing.');

// Build
program
  .command('build')
  .description('Builds selected library and performs post-build actions.')
  .argument('<libraryProject>', `Name of the library, defined as a project in ${NEST_FILE}`)
  .option('-a, --assets <patterns...>', 'Specify glob patterns to copy assets, relative to the library directory')
  .option('-r --rootAssets <patterns...>', 'Specify glob patters to copy assets, relative to the Nest.js root directory')
  .option('-m --merge <paths...>', 'Paths to merge in the output package.json from the root package.json file, in dot notation.')
  .option('-v --version <version>', 'Overwrites the version in the output package.json file.')
  .action(build);

// Parse and run CLI
program.parseAsync()
  .catch(err => console.error(err));
