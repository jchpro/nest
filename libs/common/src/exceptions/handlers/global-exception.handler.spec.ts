import {
  CaughtExceptionHttpContext,
  ExceptionHandlerBehaviorHttp,
  ExceptionHandlingInstructions,
  GlobalExceptionHandler,
  GlobalExceptionHandlerOptions,
} from '@jchpro/nest-common';
import { HttpException } from '@nestjs/common';

jest.mock('crypto', () => ({
  randomUUID: () => 'random',
}));

jest.mock('@nestjs/common', () => ({
  Catch: function() {
  },
  HttpStatus: {
    INTERNAL_SERVER_ERROR: 500,
  },
  Logger: class {
    log() {}
    error() {}
  }
}));

jest.mock('@nestjs/core', () => ({
  HttpAdapterHost: class {},
}));

describe('GlobalExceptionHandler', () => {
  let handler: GlobalExceptionHandler;
  const httpAdapterMock = {
    getRequestUrl: () => 'url',
    reply: () => {},
  };
  const mockApp: any = {
    useGlobalFilters: (arg: any) => {
      handler = arg;
    },
    get: () => ({
      httpAdapter: httpAdapterMock,
    }),
  };

  class Behavior extends ExceptionHandlerBehaviorHttp {
      constructor(
        private readonly shouldRecognize: boolean,
        private readonly instructWith: ExceptionHandlingInstructions
      ) {
        super();
      }
      recognize(exception: unknown): exception is HttpException {
         return this.shouldRecognize;
      }
      instruct(caught: CaughtExceptionHttpContext): ExceptionHandlingInstructions {
          return this.instructWith;
      }
  }

  beforeEach(() => {
    (GlobalExceptionHandler as any).getTimestamp = jest.fn().mockReturnValue('ts');
    (handler as any) = undefined;
  });

  it('should fail instantiation when no context is configured', () => {
    // When
    const runner = () => {
      GlobalExceptionHandler.setup(mockApp, {});
    };

    // Then
    expect(runner).toThrow();
  })

  it('should instantiate and register as global filter', () => {
    // When
    GlobalExceptionHandler.setup(mockApp, { http: new Behavior(false, {} as any) });

    // Then
    expect(handler).toBeTruthy();
  });

  it('should use logger and unknown error name passed in options object', () => {
    // Given
    let errorNameRead = false;
    const options: GlobalExceptionHandlerOptions = {
      logger: {
        log: () => {}
      } as any,
      get unknownErrorName() {
        errorNameRead = true;
        return 'WhoDis';
      }
    };
    const logSpy = jest.spyOn(options.logger!, 'log');

    // When
    GlobalExceptionHandler.setup(mockApp, { http: new Behavior(false, {} as any) }, options);

    // Then
    expect(logSpy).toHaveBeenCalled();
    expect(errorNameRead).toBe(true);
  });

  it('should call behavior\'s methods and reply based on returned instructions when handling caught recognized exception in http context', () => {
    // Given
    const behavior = new Behavior(true, {
      log: ['log'],
      respondWith: { thisIs: 'exception' }
    });
    const options: GlobalExceptionHandlerOptions = {
      logger: {
        log: () => {},
        error: () => {}
      } as any,
    };
    const httpHost: any = {
      getRequest: () => ({}),
      getResponse: () => ({})
    };
    const host: any = {
      getType: () => 'http',
      switchToHttp: () => httpHost
    };
    const exception = {
      name: 'error',
      message: 'message',
      stack: 'stack',
      getStatus: () => 404
    };
    const recognizeSpy  = jest.spyOn(behavior, 'recognize');
    const instructSpy = jest.spyOn(behavior, 'instruct');
    const logSpy = jest.spyOn(options.logger!, 'error');
    const replySpy = jest.spyOn(httpAdapterMock, 'reply');
    GlobalExceptionHandler.setup(mockApp, { http: behavior }, options);

    // When
    handler.catch(exception, host);

    // Then
    expect(recognizeSpy).toHaveBeenCalledWith(exception);
    expect(instructSpy).toHaveBeenCalledWith({
      exception,
      host: httpHost,
      recognized: true,
      data: {
        error: 'error',
        message: 'message',
        stack: 'stack',
        path: 'url',
        uuid: 'random',
        statusCode: 404,
        timestamp: 'ts'
      }
    });
    expect(logSpy).toHaveBeenCalledWith('log');
    expect(replySpy).toHaveBeenCalledWith({}, { thisIs: 'exception' }, 404);
  });


  it('should extract exception info reply based on returned instructions when handling caught unrecognized exception in http context', () => {
    // Given
    const behavior = new Behavior(false, {
      log: ['log'],
      respondWith: { thisIs: 'exception' }
    });
    const options: GlobalExceptionHandlerOptions = {
      logger: {
        log: () => {},
        error: () => {}
      } as any,
    };
    const httpHost: any = {
      getRequest: () => ({}),
      getResponse: () => ({})
    };
    const host: any = {
      getType: () => 'http',
      switchToHttp: () => httpHost
    };
    const exception = {
      name: 'error',
      message: 'message',
      stack: 'stack',
    };
    const instructSpy = jest.spyOn(behavior, 'instruct');
    const replySpy = jest.spyOn(httpAdapterMock, 'reply');
    GlobalExceptionHandler.setup(mockApp, { http: behavior }, options);

    // When
    handler.catch(exception, host);

    // Then
    expect(instructSpy).toHaveBeenCalledWith({
      exception,
      host: httpHost,
      recognized: false,
      data: {
        error: 'error',
        message: 'message',
        stack: 'stack',
        path: 'url',
        uuid: 'random',
        statusCode: 500,
        timestamp: 'ts'
      }
    });
    expect(replySpy).toHaveBeenCalledWith({}, { thisIs: 'exception' }, 500);
  });
});
