import { Library } from './library';

let readFileResult: string | undefined;
let existsResult: boolean = false;

jest.mock('fs/promises', () => ({
  readFile: () => Promise.resolve(readFileResult),
  stat: () => existsResult ? Promise.resolve({
    isFile: () => true
  }) : Promise.reject('nope')
}))

jest.mock('path', () => ({
  join: (...args: any[]) => args.join(''),
}))

describe('Library', () => {
  let library: Library;
  let mockPath: any;

  beforeEach(async () => {
    mockPath = jest.requireMock('path');
    readFileResult = `{"compilerOptions":{"outDir":"/dist/myLib"}}`;
    library = await Library.init(
      'myLib',
      {
        type: 'library',
        root: '/myLib',
        entryFile: '/index', // Slash just for the mocked `join`
        sourceRoot: '/myLib/src',
        compilerOptions: {
          tsConfigPath: "/myLib/tsconfig.lib.json"
        }
      },
      '/root'
    );
    readFileResult = undefined;
    existsResult = false;
  });

  it('should create', async () => {
    expect(library).toBeTruthy();
  });

  it('should return all directory paths while calling `path` join', () => {
    // Given
    const fsSpy = jest.spyOn(mockPath, 'join');

    // Then
    expect(library.rootDir).toEqual("/root/myLib");
    expect(library.sourceRootDir).toEqual("/root/myLib/src");
    expect(library.tsConfigPath).toEqual("/root/myLib/tsconfig.lib.json");
    expect(library.tsOutDir).toEqual("/root/myLib/dist/myLib");
    expect(library.distEntryFile).toEqual("/root/myLib/dist/myLib/index.js");

    // And
    expect(fsSpy).toHaveBeenCalled();
  });

  it('should return librarian file if it exists', async () => {
    // Given
    existsResult = true;
    readFileResult = `{"version":"0.0.0"}`;

    // When
    const librarianFile = await library.getLibrarianFile();

    // Then
    expect(librarianFile).toBeTruthy();
    expect(librarianFile).toEqual({version: '0.0.0'});
  });

  it('should not return librarian file if it doesn\'t exists', async () => {
    // Given default values

    // When
    const librarianFile = await library.getLibrarianFile();

    // Then
    expect(librarianFile).toBeFalsy();
  });

});
