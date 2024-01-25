import { CaughtExceptionHttpContext, ExceptionHandlerBehaviorHttp } from '@jchpro/nest-common';
import { NotFoundException } from '@nestjs/common';

describe('ExceptionHandlerBehaviorHttp', () => {
  let behavior: ExceptionHandlerBehaviorHttp;

  beforeEach(() => {
    behavior = new ExceptionHandlerBehaviorHttp();
  });

  it('should recognize HttpException and not anything else', () => {
    expect(behavior.recognize(new NotFoundException())).toBe(true);
    expect(behavior.recognize(new Error())).toBe(false);
    expect(behavior.recognize({})).toBe(false);
    expect(behavior.recognize('error')).toBe(false);
  });

  it('should return proper instructions for recognized error', () => {
    // Given
    const context: CaughtExceptionHttpContext = {
      host: {} as any,
      exception: new NotFoundException(),
      recognized: true,
      data: {
        error: 'error',
        message: 'message',
        uuid: 'uuid',
        timestamp: 'ts',
        stack: 'stack',
        statusCode: 404
      }
    };

    // When
    const instructions = behavior.instruct(context);

    // Then
    expect(instructions).toEqual({
      log: ['error: message'],
      respondWith: {
        error: 'error',
        message: 'message',
        timestamp: 'ts',
        statusCode: 404
      }
    });
  });

  it('should return proper instructions for unrecognized error', () => {
    // Given
    const context: CaughtExceptionHttpContext = {
      host: {} as any,
      exception: new Error(),
      recognized: false,
      data: {
        error: 'error',
        message: 'message',
        uuid: 'uuid',
        timestamp: 'ts',
        stack: 'stack',
        statusCode: 500
      }
    };

    // When
    const instructions = behavior.instruct(context);

    // Then
    expect(instructions).toEqual({
      log: ['[uuid] error: message', 'stack'],
      respondWith: {
        error: 'error',
        message: 'message',
        uuid: 'uuid',
        timestamp: 'ts',
        statusCode: 500
      }
    });
  });

});
