import { copyFile, mkdir, readFile, stat, writeFile } from 'fs/promises';

/**
 * Reads file as UTF-8 and parses its contents as JSON, doesn't catch any errors.
 */
export async function readJsonObject<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf-8'));
}

/**
 * Stringify object as JSON and writes the file as UTF-8, doesn't catch any errors.
 */
export async function writeJsonObject<T extends object>(filePath: string, object: T, indents: number | null = 2): Promise<void> {
  await writeFile(filePath, JSON.stringify(object, null, indents ?? undefined), 'utf-8');
}

/**
 * Checks if entity exists, when `expect` is passed, type of the entity will be also checked.
 */
export async function exists(path: string, expect?: 'file' | 'dir'): Promise<boolean> {
  try {
    const stats = await stat(path);
    if (expect) {
      return expect === 'file' ? stats.isFile() : stats.isDirectory();
    }
    return true;
  } catch (err: unknown) {
    console.log(err);
    return false;
  }
}

/**
 * Copies files, provided paths must be absolute.
 */
export async function copyFiles(instructions: FileCopyInstruction[]): Promise<void> {
  for (const { from, to } of instructions) {
    await copyFile(from, to)
  }
}

export interface FileCopyInstruction {
  readonly from: string;
  readonly to: string
}

/**
 * Creates directory paths recursively, provided paths must be absolute.
 */
export async function createPaths(directories: string[]): Promise<void> {
  for (const dir of directories) {
    await mkdir(dir, { recursive: true });
  }
}
