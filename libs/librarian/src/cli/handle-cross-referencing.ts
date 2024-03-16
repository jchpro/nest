import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { dirname, join, relative } from 'path';
import { join as posixJson } from 'path/posix';
import { rimraf } from 'rimraf';
import { PackageJson } from 'types-package-json';
import { BUILD_STAGING_DIR, PACKAGE_LIB_FILE } from '../consts';
import { DEPENDENCY_SOURCES } from '../utilities/dependencies';
import { Library } from '../context/library';
import { Project } from '../context/project';
import { copyFiles, createPaths, FileCopyInstruction } from '../utilities/filesystem';

export async function handleCrossReferencing(library: Library,
                                             libJson: PackageJson,
                                             project: Project) {

  // Collect cross-referencing data

  const aliasToName: Record<string, string> = {};
  const allDeps: string[] = [];
  const refAliases: string[] = [];

  // Read all dependencies of this library
  for (const source of DEPENDENCY_SOURCES) {
    const depsObject = libJson[source] as Record<string, string> | undefined;
    if (!depsObject) {
      continue;
    }
    allDeps.push(...Object.keys(depsObject));
  }

  // Prepare alias to name mapping
  for (const lib of project.libraries) {
    const otherLibJson = await lib.getLibrarianFile();
    if (!otherLibJson) {
      console.warn(`Library "${lib.name}", doesn't contain ${PACKAGE_LIB_FILE}, not checking for cross-referencing.`);
      continue;
    }
    aliasToName[otherLibJson.name] = lib.name;
  }

  // Store any aliases that are present in the dependency list
  for (const alias of Object.keys(aliasToName)) {
    if (allDeps.includes(alias)) {
      refAliases.push(alias);
    }
  }

  // If there aren't any, quit
  if (!refAliases.length) {
    return;
  }

  // What directories we should expect
  const tsOutDir = library.tsOutDir;
  const libDistDir = join(tsOutDir, library.name);

  // Resolve proper build output directory, copy to staging
  const fromRootToSource = relative(library.config.root, library.config.sourceRoot);
  const realLibSrcDir = join(libDistDir, fromRootToSource);
  const stagingDir = join(library.tsOutDir, BUILD_STAGING_DIR);
  const copies: FileCopyInstruction[] = (await glob('**/*.*', { cwd: realLibSrcDir }))
    .map(pathFromRealSrc => {
      const from = join(realLibSrcDir, pathFromRealSrc);
      const to = join(stagingDir, pathFromRealSrc);
      return { from, to };
    });
  await createPaths(copies.map(({ to }) => dirname(to)));
  await copyFiles(copies);

  // Cleanup old dirs
  const dirsToCleanup: string[] = [libDistDir].concat(refAliases.map(alias => {
    return join(tsOutDir, aliasToName[alias]!);
  }));
  for (const dir of dirsToCleanup) {
    await rimraf(dir);
  }

  // Undo paths alias resolving Nest did during build
  const lookupToAlias: Record<string, string> = {};
  refAliases.forEach(alias => {
    const otherLibName = aliasToName[alias]!;
    const otherLib = project.libraries.find(lib => lib.name === otherLibName)!;
    const libRootToSrc = relative(otherLib.config.root, otherLib.config.sourceRoot);
    const lookup = posixJson(otherLibName, libRootToSrc).replace(/\//, '\\\/');
    lookupToAlias[lookup] = alias;
  });
  const codeFiles = copies.map(c => c.to);
  for (const filePath of codeFiles) {
    const code = await readFile(filePath, 'utf-8');
    await undoPathAliasingCommonJs({ code, filePath }, lookupToAlias);
  }

  // Copy everything to the target distribution directory
  const finalCopies = copies.map(({ to }) => {
    const fromStaging = relative(stagingDir, to);
    return {
      from: to,
      to: join(tsOutDir, fromStaging)
    };
  });
  await createPaths(finalCopies.map(({ to }) => dirname(to)));
  await copyFiles(finalCopies);

  // Delete staging directory
  await rimraf(stagingDir);
}

async function undoPathAliasingCommonJs(input: { filePath: string; code: string; },
                                        lookupToAlias: Record<string, string>) {
  for (const [lookup, alias] of Object.entries(lookupToAlias)) {
    const regex = new RegExp('require\\(.+' + lookup + '.+\\)', 'g');
    const replaceWith = `require("${alias}")`;
    const newCode = input.code.replaceAll(regex, replaceWith);
    await writeFile(input.filePath, newCode);
  }
}
