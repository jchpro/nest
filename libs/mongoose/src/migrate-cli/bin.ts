#!/usr/bin/env node

import { Command } from "commander";
import { generate } from './commands/generate';
import { setup } from "./commands/setup";

// Program
const program = new Command()
  .name('mongo-migrate')
  .description('CLI utility for simple management of MongoDB migration files');

// Setup
program
  .command('setup')
  .description('Setup management of migrations in the Nest.js project')
  .option('-p --project', 'Name of the project, as defined in `nest-cli.json`, required only in monorepo workspace')
  .option('-c, --collector', 'Path to the collector TypeScript file, relative to source root', 'app.migrations.ts')
  .option('-dir, --directory', 'Path to the directory with migration files, relative to source root', 'migrations')
  .option('-d, --default', 'Set this project as default for CLI commands', false)
  .action(setup);

// Generate
program
  .command('generate')
  .alias('g')
  .description('Generates migration file for a project')
  .argument('<name>', 'Descriptive name of the migration, use sentence case')
  .option('-p, --project', 'Which project to use, if not provided default will be used, if defined', '')
  .action(generate);

// Parse and run CLI
program.parseAsync()
  .catch(err => console.error(err));
