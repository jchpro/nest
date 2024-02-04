import { CaughtExceptionHttpContext, CaughtExceptionHttpData } from '../types/caught-exception-http-context';
import { ExceptionHandlingInstructions } from '../types/exception-handling.instructions';
import { ExceptionHandlerBehavior } from './exception-handler-behavior';
import { HttpException } from '@nestjs/common';

/**
 * Behavior for exception handler in HTTP context:
 *   - recognized errors are of {@link HttpException} type;
 *   - recognized errors will never have UUID attached to the response object, and logged;
 *   - unrecognized errors will always have UUID attached to the response object, and logged;
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
      respondWith: this.prepareResponseObject(data, { uuid: false, stack: false })
    };
  }

  protected instructForUnrecognized({ logMessage, data, exception }: {
    logMessage: string;
    exception: unknown;
    data: CaughtExceptionHttpData;
  }): ExceptionHandlingInstructions {
    return {
      log: this.unrecognizedLogArguments({ logMessage, data, exception }),
      respondWith: this.prepareResponseObject(data, { uuid: true, stack: false })
    };
  }

}

