import { copyFiles, createPaths, exists, FileCopyInstruction, readJsonObject, writeJsonObject } from './filesystem';

let failStat = false;
let statResult: 'file' | 'dir' = 'file';

const fsCaptures = {
  readFile: (...args: any[]) => {},
  writeFile: (...args: any[]) => {},
  stat: (...args: any[]) => {},
  copyFile: (...args: any[]) => {},
  mkdir: (...args: any[]) => {},
} as const;

// I wasn't able to work with spies on `fs/promises` any other way :|
function capture(method: keyof typeof fsCaptures, fn: (...args: any[]) => any) {
  return (...args: any[]) => {
    fsCaptures[method](...args);
    return fn(...args);
  };
}

jest.mock('fs/promises', () => ({
  readFile: capture('readFile', () => Promise.resolve(`{"hello": "world"}`)),
  writeFile: capture('writeFile', () => Promise.resolve()),
  stat: capture('stat', () => failStat ? Promise.reject('error')
                                        : Promise.resolve({
      isFile: () => statResult === 'file',
      isDirectory: () => statResult === 'dir'
    })),
  copyFile: capture('copyFile', () => Promise.resolve()),
  mkdir: capture('mkdir', (dir: string) => Promise.resolve(dir))
}))

describe('filesystem.readJsonObject', () => {

  it('should call `fs` method and parse returned contents as json', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'readFile');

    // When
    const results = await readJsonObject('/mock.json');

    // Then
    expect(results).toEqual({hello: 'world'});
    expect(fsSpy).toHaveBeenCalledWith('/mock.json', 'utf-8');
  });

});

describe('filesystem.writeJsonObject', () => {
  const path = '/mock.json';

  it('should call `fs` method passing stringified json', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'writeFile');

    // When
    await writeJsonObject(path, { hello: 'world' });

    // Then
    expect(fsSpy).toHaveBeenCalledWith(path, `{\n  "hello": "world"\n}`, 'utf-8');
  });

  it('should stringify object with indentation set to 4', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'writeFile');

    // When
    await writeJsonObject(path, { hello: 'world' }, 4);

    // Then
    expect(fsSpy).toHaveBeenCalledWith(path, `{\n    "hello": "world"\n}`, 'utf-8');
  });

});

describe('filesystem.exists', () => {
  const path = '/mock.json';
  let existsExpect: 'file' | 'dir' | undefined;

  beforeEach(() => {
    existsExpect = undefined;
    failStat = false;
    statResult = 'file';
  });

  it('should call `fs` method and successfully stat file', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'stat');
    existsExpect = 'file';
    failStat = false;
    statResult = 'file';

    // When
    const result = await exists(path, existsExpect);

    // Then
    expect(result).toBe(true);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

  it('should call `fs` method and successfully stat directory', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'stat');
    existsExpect = 'dir';
    failStat = false;
    statResult = 'dir';

    // When
    const result = await exists(path, existsExpect);

    // Then
    expect(result).toBe(true);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

  it('should call `fs` method and fail to stat entity', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'stat');
    failStat = true;

    // When
    const result = await exists(path);

    // Then
    expect(result).toBe(false);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

  it('should call `fs` method and successfully stat, but return `false` due to mismatched entity type', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'stat');
    existsExpect = 'file';
    failStat = false;
    statResult = 'dir';

    // When
    const result = await exists(path, existsExpect);

    // Then
    expect(result).toBe(false);
    expect(fsSpy).toHaveBeenCalledWith(path);
  });

});

describe('filesystem.copyFiles', () => {
  const path = '/mock.json';

  it('should call `fs` method with all provided paths from instructions', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'copyFile');
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
  const path = '/mock.json';

  it('should call `fs` method with all provided paths and recursive option', async () => {
    // Given
    const fsSpy = jest.spyOn(fsCaptures, 'mkdir');
    const dirs: string[] = ['dir_1', 'dir_2'];

    // When
    await createPaths(dirs);

    // Then
    expect(fsSpy).toHaveBeenCalledWith('dir_1', { recursive: true });
    expect(fsSpy).toHaveBeenCalledWith('dir_2', { recursive: true });
  });

});
