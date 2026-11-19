import { type CaughtExceptionHttpContext, ExceptionHandlerBehaviorHttp } from '../../index.js';
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

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
      level: 'debug',
      respondWith: {
        error: 'error',
        message: 'message',
        timestamp: 'ts',
        statusCode: 404
      }
    });
  });

  describe('log level', () => {
    function levelFor(exception: unknown, recognized: boolean, statusCode: number, b = behavior) {
      return b.instruct(({
        host: {} as any,
        exception,
        recognized,
        data: { error: 'e', message: 'm', timestamp: 'ts', statusCode }
      } as CaughtExceptionHttpContext)).level;
    }

    it('should be debug for 404', () => {
      expect(levelFor(new NotFoundException(), true, 404)).toBe('debug');
    });

    it.each([400, 401, 403, 409, 422, 429])('should be warn for recognized %s', (status) => {
      expect(levelFor(new HttpException('x', status), true, status)).toBe('warn');
    });

    it.each([500, 502, 503])('should be error for recognized %s', (status) => {
      expect(levelFor(new HttpException('x', status), true, status)).toBe('error');
    });

    it('should be error for unrecognized errors', () => {
      expect(levelFor(new Error('boom'), false, 500)).toBe('error');
    });

    it('should be what an overridden logLevelFor returns', () => {
      class Custom extends ExceptionHandlerBehaviorHttp {
        protected logLevelFor(): 'error' {
          return 'error';
        }
      }
      expect(levelFor(new NotFoundException(), true, 404, new Custom())).toBe('error');
    });
  });

  describe('details of a recognized error', () => {
    function respondWith(exception: HttpException, dataExtras: object = {}) {
      return behavior.instruct({
        host: {} as any,
        exception,
        recognized: true,
        data: { error: exception.name, message: exception.message, timestamp: 'ts', statusCode: exception.getStatus(), ...dataExtras }
      }).respondWith;
    }

    it('should have the messages which ValidationPipe puts into the response body', () => {
      // `ValidationPipe` throws `BadRequestException` with the array of messages
      const exception = new BadRequestException(['name should not be empty', 'age must be a number']);

      const response = respondWith(exception);

      expect(exception.message).toBe('Bad Request Exception');
      expect(response).toMatchObject({
        message: 'Bad Request Exception',
        details: ['name should not be empty', 'age must be a number'],
      });
    });

    it.each([
      ['a message which is a string', new BadRequestException('plain')],
      ['a response which is a string', new HttpException('plain', 418)],
      ['an empty array of messages', new BadRequestException([])],
      ['an array of something else than strings', new BadRequestException([{ field: 'name' }] as any)],
      ['a response with no message', new HttpException({ code: 'X' }, 422)],
    ])('should have no details for %s', (_name, exception) => {
      const response = respondWith(exception);

      expect(response).not.toHaveProperty('details', expect.anything());
    });

    it('should keep the details which were already put into the data', () => {
      const response = respondWith(new BadRequestException(['from the body']), { details: ['set earlier'] });

      expect(response).toMatchObject({ details: ['set earlier'] });
    });

    it('can be extracted differently by a subclass', () => {
      class OwnBehavior extends ExceptionHandlerBehaviorHttp {
        protected extractDetails(exception: HttpException): string[] {
          return [`status ${exception.getStatus()}`];
        }
      }

      const response = new OwnBehavior().instruct({
        host: {} as any,
        exception: new NotFoundException(),
        recognized: true,
        data: { error: 'NotFoundException', timestamp: 'ts', statusCode: 404 }
      }).respondWith;

      expect(response).toMatchObject({ details: ['status 404'] });
    });

    it('should not be added to the response of an unrecognized error', () => {
      const response = behavior.instruct({
        host: {} as any,
        exception: new BadRequestException(['not seen']) as unknown,
        recognized: false,
        data: { error: 'Error', timestamp: 'ts', statusCode: 500, uuid: 'uuid' }
      }).respondWith;

      expect(response).not.toHaveProperty('details', expect.anything());
    });
  });

  it('should return proper instructions for unrecognized error, not revealing what it was in the response', () => {
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
      level: 'error',
      respondWith: {
        error: 'InternalServerError',
        uuid: 'uuid',
        timestamp: 'ts',
        statusCode: 500
      }
    });
  });

});
