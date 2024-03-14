import { PackageJson } from 'types-package-json';

type JsonField = keyof PackageJson;

export const DEPENDENCY_SOURCES: JsonField[]
  = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;
