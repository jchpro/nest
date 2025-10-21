import { SwaggerUi, SwaggerUiFactory } from '@jchpro/nest-common/openapi';

jest.mock('../internal/swagger', () => {
  const actual = jest.requireActual('../internal/swagger');
  return {
    ...actual,
    SwaggerModule: {
      setup: () => { },
      createDocument: () => ({
        mock: 'openapi-doc'
      })
    }
  };
});

describe('SwaggerUiFactory', () => {
  let ui: SwaggerUi;
  let mockModule: any;

  beforeEach(() => {
    (ui as any) = undefined;
    mockModule = jest.requireMock('../internal/swagger').SwaggerModule;
  });

  it('should create instance passing right parameters to `SwaggerModule.createDocument`', () => {
    // Given
    const createDocSpy = jest.spyOn(mockModule, 'createDocument');

    // When
    ui = SwaggerUiFactory.create(
      { app: true } as any,
      { config: true } as any,
      { extraModels: [] }
    );

    // Then
    expect(ui).toBeTruthy();
    expect(createDocSpy).toHaveBeenCalledWith(
      { app: true },
      { config: true },
      { extraModels: [] }
    );
  });

  it('should call `SwaggerModule.setup` with path, app and created openapi doc', () => {
    // Given
    const setupSpy = jest.spyOn(mockModule, 'setup');
    ui = SwaggerUiFactory.create({} as any, {} as any);

    // When
    ui.serve('/path');

    // Then
    expect(setupSpy).toHaveBeenCalledWith(
      'path',
      {},
      { mock: 'openapi-doc' },
      undefined
    );
  });

  it('should register endpoint and serve doc on it when right options were passed', () => {
    // Given
    let registeredHandler!: (req: any, res: any) => {};
    const mockResponse = { json: () => {} };
    const mockServer = {
      use: (p: any, handler: (req: any, res: any) => {}) => {
        registeredHandler = handler;
      }
    };
    const useHandlerSpy = jest.spyOn(mockServer, 'use');
    const serveJsonSpy = jest.spyOn(mockResponse, 'json');
    ui = SwaggerUiFactory.create({
      getHttpAdapter: () => mockServer
    } as any, {} as any);

    // When
    ui.serve('path', { serveDoc: true, docPath: 'my.json' });

    // Then
    expect(useHandlerSpy).toHaveBeenCalledWith('/path/my.json', expect.any(Function));
    expect(registeredHandler).toBeTruthy();

    // And when
    registeredHandler({}, mockResponse);

    // Then
    expect(serveJsonSpy).toHaveBeenCalledWith({ mock: 'openapi-doc' });
  });

});
