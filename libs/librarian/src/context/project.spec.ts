import { Project } from './project';
import { NestConfig, NestLibrary } from '@jchpro/nest-librarian';
import { NEST_FILE } from '../consts';

let readFileResult: string | undefined;
let existsResult: boolean = true;

const captures = {
  readFile: (...args: any[]) => {},
} as const;

// I wasn't able to work with spies on `fs/promises` any other way :|
function capture(method: keyof typeof captures, fn: (...args: any[]) => any) {
  return (...args: any[]) => {
    captures[method](...args);
    return fn(...args);
  };
}

jest.mock('fs/promises', () => ({
  readFile: capture('readFile', () => Promise.resolve(readFileResult)),
  stat: () => existsResult ? Promise.resolve({
    isFile: () => true
  }) : Promise.reject('nope')
}))

jest.mock('path', () => ({
  join: (...args: string[]) => args
    .map(part => part === NEST_FILE ? `/${part}` : part).join(''),
  dirname: (path: string) => {
    return path.slice(0, path.lastIndexOf('/'));
  },
}))

let iteratorDone = false;
jest.mock('find-package-json', () => {
  return () => ({
    next() {
      if (!iteratorDone) {
        iteratorDone = true;
        return {
          done: false,
          filename: '/root/package.json'
        };
      }
      return { done: true };
    }
  })
})

describe('Project', () => {
  let project: Project;

  function getNestConfig(): NestConfig {
    return {
      projects: {
        library_1: getLibraryConfig(1),
        library_2: getLibraryConfig(2),
        library_3: getLibraryConfig(3),
      }
    };
  }

  function getLibraryConfig(i: number): NestLibrary {
    return {
      type: `library`,
      root: `/myLib_${i}`,
      entryFile: '/index', // Slash just for the mocked `join`
      sourceRoot: `/myLib_${i}/src`,
      compilerOptions: {
        tsConfigPath: `/myLib_${i}/tsconfig.lib.json`
      }
    }
  }

  beforeEach(async () => {
    iteratorDone = false;
    readFileResult = JSON.stringify(getNestConfig());
    project = await Project.locate();
  });

  it('should create project with 3 libraries', () => {
    expect(project).toBeTruthy();
    expect(project.libraries.length).toBe(3);
  });

  it('should read package.json from the resolved path', async () => {
    // Given
    readFileResult = `{"version":"0.0.0"}`;
    const fsSpy = jest.spyOn(captures, 'readFile');

    // When
    const json = await project.getPackageJson();

    // Then
    expect(json).toEqual({ version: '0.0.0' });
    expect(fsSpy).toHaveBeenCalledWith('/root/package.json', 'utf-8');
  });

});