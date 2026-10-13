// Packs every workspace package and installs the tarballs into a throwaway project, to prove the published artifacts
// work outside this repo: the files list is complete, the `exports` map resolves (ESM `import` and `require`), the
// peer dependency declarations are sufficient, optional peers are really optional, and the type declarations compile
// for a consumer, and the tarballs contain the readme, changelog and docs. Run it with `npm run verify:libs` (the libs must be built first, `prepack` is not used on purpose).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
// Only the libraries are published, `apps/*` (the example app) are private
const workspaces = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).workspaces.filter(w => w.startsWith('libs/'));
const packages = workspaces.map(w => JSON.parse(readFileSync(join(root, w, 'package.json'), 'utf8')));
const OPTIONAL_PEERS = ['@nestjs/swagger', '@nestjs/throttler', 'bcrypt', 'morgan'];

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8', shell: process.platform === 'win32' });
const step = (msg) => console.log(`\n== ${msg}`);

const work = mkdtempSync(join(tmpdir(), 'verify-libs-'));
const tarballs = join(work, 'tarballs');
const consumer = join(work, 'consumer');
mkdirSync(tarballs);
mkdirSync(consumer);

try {
  step('Packing');
  for (const w of workspaces) {
    run(npm, ['pack', '--pack-destination', tarballs, '--workspace', w, '--silent'], root);
  }
  const files = readdirSync(tarballs);
  console.log(files.join('\n'));

  step('Checking the tarballs contain the docs, readme, changelog and build output');
  for (const [i, w] of workspaces.entries()) {
    const pkg = packages[i];
    const tarball = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
    const contents = run('tar', ['-tzf', tarball], tarballs).split(/\r?\n/).map(l => l.trim().replace(/^package\//, ''));
    const docsDir = join(root, w, 'docs');
    const expected = [
      'package.json', 'readme.md', 'changelog.md', 'dist/index.js', 'dist/index.d.ts',
      ...(existsSync(docsDir) ? readdirSync(docsDir).map(f => `docs/${f}`) : []),
    ];
    const missing = expected.filter(f => !contents.includes(f));
    if (missing.length) {
      throw new Error(`${pkg.name} tarball is missing: ${missing.join(', ')}`);
    }
    console.log(`tar ok  ${pkg.name} (${expected.length} expected files present)`);
  }

  step('Installing the tarballs into a clean project (required peers only)');
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
  run(npm, ['install', '--no-audit', '--no-fund', ...files.map(f => join(tarballs, f)), 'typescript@~6.0.0', '@types/node@24'], consumer);

  const entries = packages.flatMap(p => Object.keys(p.exports).filter(k => k !== './package.json').map(k => p.name + k.slice(1)));
  const subpathNeedsOptional = (spec) => /nest-common\/(auth|openapi|request-logger|throttling)$/.test(spec);
  const rootEntries = entries.filter(e => !subpathNeedsOptional(e));

  step('Importing entry points that must work without optional peers (ESM + CJS)');
  const esm = rootEntries.map(e => `await import('${e}'); console.log('esm ok  ${e}');`).join('\n');
  const cjs = rootEntries.map(e => `require('${e}'); console.log('cjs ok  ${e}');`).join('\n');
  writeFileSync(join(consumer, 'check.mjs'), esm);
  writeFileSync(join(consumer, 'check.cjs'), cjs);
  console.log(run('node', ['check.mjs'], consumer) + run('node', ['check.cjs'], consumer));

  step(`Installing optional peers (${OPTIONAL_PEERS.join(', ')}) and importing the remaining subpaths`);
  const rootDeps = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies;
  run(npm, ['install', '--no-audit', '--no-fund', ...OPTIONAL_PEERS.map(p => `${p}@${rootDeps[p]}`), '@types/bcrypt', '@types/morgan', '@types/express'], consumer);
  const subpaths = entries.filter(subpathNeedsOptional);
  writeFileSync(join(consumer, 'check-sub.mjs'), subpaths.map(e => `await import('${e}'); console.log('esm ok  ${e}');`).join('\n'));
  writeFileSync(join(consumer, 'check-sub.cjs'), subpaths.map(e => `require('${e}'); console.log('cjs ok  ${e}');`).join('\n'));
  console.log(run('node', ['check-sub.mjs'], consumer) + run('node', ['check-sub.cjs'], consumer));

  step('Type-checking a consumer (nodenext and bundler resolution)');
  const imports = entries.map((e, i) => `import * as m${i} from '${e}';`).join('\n');
  const uses = entries.map((_, i) => `void m${i};`).join('\n');
  writeFileSync(join(consumer, 'consumer.ts'), `${imports}\n${uses}\n`);
  for (const [name, compilerOptions] of Object.entries({
    nodenext: { module: 'nodenext', moduleResolution: 'nodenext' },
    bundler: { module: 'preserve', moduleResolution: 'bundler' },
  })) {
    writeFileSync(join(consumer, `tsconfig.${name}.json`), JSON.stringify({
      compilerOptions: { ...compilerOptions, target: 'ES2022', strict: true, noEmit: true, types: ['node'], skipLibCheck: false, experimentalDecorators: true, emitDecoratorMetadata: true },
      files: ['consumer.ts'],
    }));
    // Third-party declarations (e.g. throttler, nestjs-i18n) are not ours to judge, so only errors reported inside
    // our own packages fail the check.
    let output = '';
    try {
      run(join(consumer, 'node_modules', '.bin', 'tsc'), ['-p', `tsconfig.${name}.json`], consumer);
    } catch (e) {
      output = String(e.stdout);
    }
    const ours = output.split(/\r?\n/).filter(l => l.startsWith('node_modules/@jchpro/') || l.startsWith('consumer.ts'));
    if (ours.length) {
      throw new Error(`Type errors in our packages (${name}):\n${ours.join('\n')}`);
    }
    console.log(`tsc ok  (${name})`);
  }

  step('Bin smoke test');
  for (const p of packages.filter(p => p.bin)) {
    for (const bin of Object.keys(p.bin)) {
      try {
        run(join(consumer, 'node_modules', '.bin', bin), [], consumer);
        throw new Error(`${bin} should have failed without arguments`);
      } catch (e) {
        if (!String(e.stderr + e.stdout).includes('argument')) throw e;
        console.log(`bin ok  ${bin} (starts and validates its arguments)`);
      }
    }
  }

  console.log('\nAll package checks passed');
} catch (e) {
  console.error(`\nFAILED: ${e.message}\n${e.stdout ?? ''}${e.stderr ?? ''}`);
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
