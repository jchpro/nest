import { glob } from 'glob';
import { PackageJson } from 'types-package-json';
import { AUTO_DEPENDENCY_VERSION, NEST_FILE, PACKAGE_FILE, PACKAGE_LIB_FILE } from '../consts';
import { Project } from '../context/project';
import { spawn } from 'child_process';
import { prepareCommand } from './common';
import { dirname, join, relative, basename } from 'path';
import { unlink } from 'fs/promises';
import { Library } from '../context/library';
import { FileCopyInstruction, copyFiles, createPaths, writeJsonObject, exists } from '../utilities/filesystem';
import { cloneDeep, get, set } from 'lodash';
import { getCleanSemver } from '../utilities/semver';

export async function build(libraryName: string, options: {
  readonly assets?: string[];
  readonly rootAssets?: string[];
  readonly merge?: string[];
  readonly version?: string;
}) {

  // Prepare and validate
  const project = await Project.locate();
  const rootJson = await project.getPackageJson();
  const library = project.libraries.find(lib => lib.name === libraryName);
  if (!library) {
    throw new Error(`Library with name "${libraryName}" is not defined in ${NEST_FILE}`);
  }
  const libJson = await library.getLibrarianFile();
  if (!libJson) {
    throw new Error(`Library doesn't contain ${PACKAGE_LIB_FILE} file.`);
  }

  // Build
  await buildLibrary(library, project);

  // Copy assets
  if (options.assets) {
    await copyAssets(library, options.assets);
  }
  if (options.rootAssets) {
    await copyRootAssets(library, project, options.rootAssets);
  }

  // Output package.json
  const outputJson = prepareLibraryJson(library, libJson, rootJson, options.merge, options.version);
  await writeJsonObject(join(library.tsOutDir, PACKAGE_FILE), outputJson);

  // Remove tsbuildinfo
  const buildInfoPath = join(library.tsOutDir, `${basename(library.tsConfigPath, '.json')}.tsbuildinfo`);
  if (await exists(buildInfoPath, 'file')) {
    await unlink(buildInfoPath);
  }
}

function buildLibrary(library: Library, project: Project) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn(prepareCommand('npx'), [
      'nest',
      'build',
      library.name
    ], {
      cwd: project.rootDir
    });
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(`Nest build process exited with code ${code}`);
    })
  });
}

async function copyAssets(library: Library, patterns: string[]) {
  const safePatterns = patterns.filter(pattern => pattern !== PACKAGE_LIB_FILE);
  const libRootDir = library.rootDir;
  const libSrcDir = library.sourceRootDir;
  const libOutDir = library.tsOutDir;
  const copies: FileCopyInstruction[] = (await glob(safePatterns, { cwd: libRootDir }))
    .map(file => {
      const from = join(libRootDir, file);
      const relativeToSrc = relative(libSrcDir, from);
      const fileAdjusted = !relativeToSrc.startsWith('..')
                           ? relativeToSrc : file;
      const to = join(libOutDir, fileAdjusted);
      return { from, to };
    });
  await createPaths(copies.map(({ to }) => dirname(to)));
  await copyFiles(copies);
}

async function copyRootAssets(library: Library, project: Project, patterns: string[]) {
  const rootDir = project.rootDir;
  const libOutDir = library.tsOutDir;
  const copies: FileCopyInstruction[] = (await glob(patterns, { cwd: rootDir }))
    .map(file => {
      const from = join(rootDir, file);
      const to = join(libOutDir, file);
      return { from, to };
    });
  await createPaths(copies.map(({ to }) => dirname(to)));
  await copyFiles(copies);
}

function prepareLibraryJson(library: Library,
                            libJson: PackageJson,
                            rootJson: PackageJson,
                            mergePaths: string[] = [],
                            forceVersion?: string) {

  // Prepare
  const outputJson = cloneDeep(libJson);
  type JsonField = keyof PackageJson;
  const depSources: JsonField[] = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  for (const source of depSources) {
    delete outputJson[source];
  }

  // Add entrypoint if missing
  if (!libJson.main) {
    outputJson.main = relative(library.tsOutDir, library.distEntryFile);
  }

  // Merge paths
  const safeMergePaths = mergePaths.filter(path => !(depSources as string[]).includes(path));
  safeMergePaths.forEach(path => {
    set(outputJson, path, get(rootJson, path));
  });

  // Resolve dependency versions
  const allRootsDeps: Record<string, string> = depSources
    .reduce((obj, source) => ({...obj, ...rootJson[source] as object}), {} as Record<string, string>);
  for (const source of depSources) {
    if (libJson[source]) {
      outputJson[source] = processDependencies(libJson[source] as Record<string, string>, allRootsDeps, source) as any;
    }
  }

  // Handle version
  if (forceVersion) {
    outputJson.version = forceVersion;
  } else {
    const version = outputJson.version === AUTO_DEPENDENCY_VERSION
                    ? rootJson.version : outputJson.version;
    outputJson.version = getCleanSemver(version);
  }

  return outputJson;
}

function processDependencies(defined: Record<string, string>, allRoot: Record<string, string>, source: string): Record<string, string> {
  return Object.entries(defined)
    .map(([name, version]) => {
      if (version === AUTO_DEPENDENCY_VERSION) {
        const rootVersion = allRoot[name];
        if (!rootVersion) {
          throw Error(`Dependency "${name}" (${source}) was not found in the root ${PACKAGE_FILE}`);
        }
        return [name, rootVersion];
      }
      return [name, version];
    })
    .reduce((obj, [name, version]) => ({...obj, [name]: version}), {} as Record<string, string>);
}
