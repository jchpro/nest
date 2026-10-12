#!/usr/bin/env node
import { generate } from './generate.js';

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
