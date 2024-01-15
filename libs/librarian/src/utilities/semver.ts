import { major, minor, patch } from 'semver';

/**
 * Returns semver with `major`, `minor`, and `patch` only, without any extra tokens.
 */
export function getCleanSemver(version: string): string {
  return [
    major(version),
    minor(version),
    patch(version),
  ].join('.');
}
