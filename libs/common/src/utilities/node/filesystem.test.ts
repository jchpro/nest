import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyFiles, createPaths, exists, type FileCopyInstruction, readDirFiles, readJsonObject, writeJsonObject } from './filesystem.js';

const state = vi.hoisted(() => ({
  failStat: false,
  statResult: 'file' as 'file' | 'dir',
}));

vi.mock('fs/promises', () => ({
  readFile: () => Promise.resolve(`{"hello": "world"}`),
  writeFile: () => Promise.resolve(),
  stat: () => state.failStat ? Promise.reject('error')
                       : Promise.resolve({
      isFile: () => state.statResult === 'file',
      isDirectory: () => state.statResult === 'dir'
    }),
  copyFile: () => Promise.resolve(),
  mkdir: (dir: string) => Promise.resolve(dir),
  readdir: () => Promise.resolve()
}));

vi.mock('path', () => ({
  extname: () => '',
  resolve: () => ''
}));

describe('filesystem.readJsonObject', () => {

  it('should call `fs` method and parse returned contents as json', async () => {
    // Given
    const mockFs = await import('fs/promises');
    const fsSpy = vi.spyOn(mockFs, 'readFile');

    // When
    const results = await readJsonObject('/mock.json');

    // Then
    expect(results).toEqual({hello: 'world'});
    expect(fsSpy).toHaveBeenCalledWith('/mock.json', 'utf-8');
  });

});

describe('filesystem.writeJsonObject', () => {
  const path = '/mock.json';
  let mockFs: any;

  beforeEach(async () => {
    mockFs = await import('fs/promises');
  });

  it('should call `fs` method passing stringified json', async () => {
    // Given
    const fsSpy = vi.spyOn(mockFs, 'writeFile');

    // When
    await writeJsonObject(path, { hello: 'world' });

    // Then
    expect(fsSpy).toHaveBeenCalledWith(path, `{\n  "hello": "world"\n}`, 'utf-8');
  });

  it('should stringify object with indentation set to 4', async () => {
    // Given
    const fsSpy = vi.spyOn(mockFs, 'writeFile');

    // When
    await writeJsonObject(path, { hello: 'world' }, 4);

    // Then
    expect(fsSpy).toHaveBeenCalledWith(path, `{\n    "hello": "world"\n}`, 'utf-8');
  });

});

describe('filesystem.exists', () => {
  const path = '/mock.json';
  let existsExpect: 'file' | 'dir' | undefined;
  let mockFs: any;

  beforeEach(async () => {
    existsExpect = undefined;
    state.failStat = false;
    state.statResult = 'file';
    mockFs = await import('fs/promises');
  });

  it('should call `fs` method and successfully stat file', async () => {
    // Given
    const fsSpy = vi.spyOn(mockFs, 'stat');
    existsExpect = 'file';
    state.failStat = false;
    state.statResult = 'file';

    // When
    const result = await exists(path, existsExpect);

    // Then
    expect(result).toBe(true);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

  it('should call `fs` method and successfully stat directory', async () => {
    // Given
    const fsSpy = vi.spyOn(mockFs, 'stat');
    existsExpect = 'dir';
    state.failStat = false;
    state.statResult = 'dir';

    // When
    const result = await exists(path, existsExpect);

    // Then
    expect(result).toBe(true);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

  it('should call `fs` method and fail to stat entity', async () => {
    // Given
    const fsSpy = vi.spyOn(mockFs, 'stat');
    state.failStat = true;

    // When
    const result = await exists(path);

    // Then
    expect(result).toBe(false);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

  it('should call `fs` method and successfully stat, but return `false` due to mismatched entity type', async () => {
    // Given
    const fsSpy = vi.spyOn(mockFs, 'stat');
    existsExpect = 'file';
    state.failStat = false;
    state.statResult = 'dir';

    // When
    const result = await exists(path, existsExpect);

    // Then
    expect(result).toBe(false);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

});

describe('filesystem.copyFiles', () => {

  it('should call `fs` method with all provided paths from instructions', async () => {
    // Given
    const mockFs = await import('fs/promises');
    const fsSpy = vi.spyOn(mockFs, 'copyFile');
    const instructions: FileCopyInstruction[] = [
      { from: 'source_1', to: 'target_1' },
      { from: 'source_2', to: 'target_2' },
    ];

    // When
    await copyFiles(instructions);

    // Then
    expect(fsSpy).toHaveBeenCalledWith('source_1', 'target_1');
    expect(fsSpy).toHaveBeenCalledWith('source_2', 'target_2');
  });

});

describe('filesystem.createPaths', () => {

  it('should call `fs` method with all provided paths and recursive option', async () => {
    // Given
    const mockFs = await import('fs/promises');
    const fsSpy = vi.spyOn(mockFs, 'mkdir');
    const dirs: string[] = ['dir_1', 'dir_2'];

    // When
    await createPaths(dirs);

    // Then
    expect(fsSpy).toHaveBeenCalledWith('dir_1', { recursive: true });
    expect(fsSpy).toHaveBeenCalledWith('dir_2', { recursive: true });
  });

});

describe('filesystem.readDirFiles', () => {

  it('should call `fs` and `path` methods used internally', async () => {
    // Given
    const dir = '/dir';
    const mockFs = await import('fs/promises');
    const mockPath = await import('path');
    const readdirSpy = vi.spyOn(mockFs, 'readdir')
      .mockResolvedValue(['file.txt', 'file.md'] as any);
    const extnameSpy = vi.spyOn(mockPath, 'extname')
      .mockImplementation((name: string) => name.slice(name.lastIndexOf('.')));
    const resolveSpy = vi.spyOn(mockPath, 'resolve')
      .mockImplementation((dir: string, file: string) => `${dir}/${file}`);

    // When
    await readDirFiles(dir, '.txt');

    // Then
    expect(readdirSpy).toHaveBeenCalledWith(dir, 'utf-8');
    expect(extnameSpy).toHaveBeenCalledWith('file.txt');
    expect(extnameSpy).toHaveBeenCalledWith('file.md');
    expect(resolveSpy).toHaveBeenCalledWith('/dir', 'file.txt');
  });

});
