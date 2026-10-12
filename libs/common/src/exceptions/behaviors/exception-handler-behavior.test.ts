import {
  type CaughtExceptionContext,
  type CaughtExceptionData,
  ExceptionHandlerBehavior,
  type ExceptionHandlingInstructions,
  type ExceptionLogArguments,
} from '../../index.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('ExceptionHandlerBehavior', () => {
  let behavior: Behavior;

  class Behavior extends ExceptionHandlerBehavior {
    recognize(exception: unknown): exception is unknown {
      throw new Error('Shouldn\'t be tested in this context.');
    }
    instruct(caught: CaughtExceptionContext): ExceptionHandlingInstructions {
      throw new Error('Shouldn\'t be tested in this context.');
    }

    recognizedLogArguments(input: {
      logMessage: string;
      exception: unknown;
      data: any;
    }): ExceptionLogArguments {
      return super.recognizedLogArguments(input);
    }

    unrecognizedLogArguments(input: {
      logMessage: string;
      exception: unknown;
      data: any;
    }): ExceptionLogArguments {
      return super.unrecognizedLogArguments(input);
    }

    prepareResponseObject(data: CaughtExceptionData,
                          options: { uuid: boolean; stack: boolean }): CaughtExceptionData {
      return super.prepareResponseObject(data, options);
    }

    getLogMessage(data: CaughtExceptionData,
                  printUuid: boolean): string {
      return super.getLogMessage(data, printUuid);
    }

    unknownErrorName?: string | undefined;
  }

  function caughtExceptionData(): CaughtExceptionData {
    return {
      error: 'error',
      timestamp: 'ts',
      uuid: 'uuid',
      stack: 'stack'
    };
  }

  beforeEach(() => {
    behavior = new Behavior();
  });

  it('should return only log message as log arguments for recognized error', () => {
    // When
    const args = behavior.recognizedLogArguments({ logMessage: 'error', data: null, exception: null });

    // Then
    expect(args).toEqual(['error']);
  });

  it('should return log message and an explicit undefined second element for unrecognized error when exception is string and stack isn\'t available', () => {
    // When
    const args = behavior.unrecognizedLogArguments({ logMessage: 'error', data: {}, exception: 'message' });

    // Then: the implementation returns `[logMessage, undefined]`, not a 1-element array (Jest's `toEqual`
    // used to treat these as equal since it ignores trailing `undefined` array elements; Vitest doesn't).
    expect(args).toEqual(['error', undefined]);
  });

  it('should return log message and stringified exception as log arguments for unrecognized error when exception isn\'t string and stack isn\'t available', () => {
    // When
    const args = behavior.unrecognizedLogArguments({ logMessage: 'error', data: {}, exception: {} });

    // Then
    expect(args).toEqual(['error', '[object Object]']);
  });

  it('should return log message and stack as log arguments for unrecognized error when stack is available', () => {
    // When
    const args = behavior.unrecognizedLogArguments({ logMessage: 'error', data: { stack: 'line 1' }, exception: null });

    // Then
    expect(args).toEqual(['error', 'line 1']);
  });

  it('should return response object with uuid and without stack', () => {
    // When
    const object = behavior.prepareResponseObject(
      caughtExceptionData(),
      { uuid: true, stack: false }
    );

    // Then
    expect(object).toEqual({
      error: 'error',
      timestamp: 'ts',
      uuid: 'uuid'
    });
  });

  it('should return response object without uuid and with stack', () => {
    // When
    const object = behavior.prepareResponseObject(
      caughtExceptionData(),
      { uuid: false, stack: true }
    );

    // Then
    expect(object).toEqual({
      error: 'error',
      timestamp: 'ts',
      stack: 'stack'
    });
  });

  it('should return log message with only error name', () => {
    // When
    const msg = behavior.getLogMessage(
      caughtExceptionData(),
      false
    );

    // Then
    expect(msg).toBe('error');
  })

  it('should return log message with uuid and error name', () => {
    // When
    const msg = behavior.getLogMessage(
      caughtExceptionData(),
      true
    );

    // Then
    expect(msg).toBe('[uuid] error');
  })

  it('should return log message with error name and message', () => {
    // Given
    const data = caughtExceptionData();
    data.message = 'message';

    // When
    const msg = behavior.getLogMessage(data, false);

    // Then
    expect(msg).toBe('error: message');
  });

  it('should return log message with error name, message and uuid', () => {
    // Given
    const data = caughtExceptionData();
    data.message = 'message';

    // When
    const msg = behavior.getLogMessage(data, true);

    // Then
    expect(msg).toBe('[uuid] error: message');
  });

});
