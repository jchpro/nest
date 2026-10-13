import { type CaughtExceptionHttpContext, type CaughtExceptionHttpData } from '../types/caught-exception-http-context.js';
import { type ExceptionHandlingInstructions } from '../types/exception-handling.instructions.js';
import { ExceptionHandlerBehavior } from './exception-handler-behavior.js';
import { HttpException } from '@nestjs/common';

/**
 * Behavior for exception handler in HTTP context:
 *   - recognized errors are of {@link HttpException} type;
 *   - recognized errors will never have UUID attached to the response object, and logged;
 *   - the response object of a recognized error has the `details` the exception carries, if any
 *     (see {@link extractDetails});
 *   - unrecognized errors will always have UUID attached to the response object, and logged;
 *   - the response object of an unrecognized error doesn't reveal what the error was: its `error` is the
 *     {@link unknownErrorName} and it has no `message` (both are in the log);
 *   - stacktrace will never be attached to the response object.
 */
export class ExceptionHandlerBehaviorHttp extends ExceptionHandlerBehavior<CaughtExceptionHttpContext, HttpException> {

  recognize(exception: unknown): exception is HttpException {
    return exception instanceof HttpException;
  }

  instruct(caught: CaughtExceptionHttpContext): ExceptionHandlingInstructions {
    const { exception, recognized, data } = caught;
    const logMessage = this.getLogMessage(data, !recognized);
    if (recognized) {
      return this.instructForRecognized({ logMessage, exception, data });
    }
    return this.instructForUnrecognized({ logMessage, exception, data });
  }

  unknownErrorName = 'InternalServerError';

  protected instructForRecognized({ logMessage, data, exception }: {
    logMessage: string;
    exception: HttpException;
    data: CaughtExceptionHttpData;
  }): ExceptionHandlingInstructions {
    return {
      log: this.recognizedLogArguments({ logMessage, data, exception }),
      respondWith: this.prepareResponseObject(
        { ...data, details: data.details ?? this.extractDetails(exception) } as CaughtExceptionHttpData,
        { uuid: false, stack: false }
      )
    };
  }

  /**
   * The messages of the exception's response body, if it has a non-empty array of strings as its `message`:
   * that is what Nest's `ValidationPipe` makes of the violated constraints, and the `message` of the exception
   * itself is only "Bad Request Exception" then. Anything else has no details.
   */
  protected extractDetails(exception: HttpException): string[] | undefined {
    const body = exception.getResponse();
    if (typeof body !== 'object' || body === null) {
      return undefined;
    }
    const { message } = body as { message?: unknown };
    if (Array.isArray(message) && message.length > 0 && message.every((item) => typeof item === 'string')) {
      return message;
    }
    return undefined;
  }

  protected instructForUnrecognized({ logMessage, data, exception }: {
    logMessage: string;
    exception: unknown;
    data: CaughtExceptionHttpData;
  }): ExceptionHandlingInstructions {
    return {
      log: this.unrecognizedLogArguments({ logMessage, data, exception }),
      respondWith: this.prepareResponseObject(this.withoutDetails(data), { uuid: true, stack: false })
    };
  }

  /**
   * What a client may learn about an unrecognized error: that it happened, not what it was.
   * The name and the message of such an error can be anything (driver errors, paths, queries...).
   */
  protected withoutDetails(data: CaughtExceptionHttpData): CaughtExceptionHttpData {
    return { ...data, error: this.unknownErrorName, message: undefined };
  }

}

