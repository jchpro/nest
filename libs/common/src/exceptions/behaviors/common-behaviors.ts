import { ExceptionHandlerBehaviorHttp } from './exception-handler-behavior-http.js';
import { type CaughtExceptionData } from '../types/caught-exception-context.js';
import { type ExceptionHandlingInstructions } from '../types/exception-handling.instructions.js';
import { type CaughtExceptionHttpData } from '../types/caught-exception-http-context.js';

/**
 * Common behavior for exception handler in HTTP context:
 *   - unrecognized errors will have UUID attached to the response object, and logged in `productionMode`;
 *   - in `productionMode` the response object of an unrecognized error doesn't reveal what the error was
 *     (see {@link ExceptionHandlerBehaviorHttp}), otherwise it carries its name, message and stacktrace;
 *   - rest as in {@link ExceptionHandlerBehaviorHttp}.
 */
export class CommonExceptionHandlerBehaviorHttp extends ExceptionHandlerBehaviorHttp {

  constructor(
    private readonly productionMode: boolean
  ) {
    super();
  }

  protected instructForUnrecognized({ logMessage, data, exception }: {
    logMessage: string;
    exception: unknown;
    data: CaughtExceptionHttpData
  }): ExceptionHandlingInstructions {
    return {
      log: this.unrecognizedLogArguments({ logMessage, data, exception }),
      respondWith: this.prepareResponseObject(this.productionMode ? this.withoutDetails(data) : data, {
        uuid: this.productionMode,
        stack: !this.productionMode
      })
    };
  }

  protected getLogMessage(data: CaughtExceptionData,
                          printUuid: boolean): string {
    return super.getLogMessage(data, this.productionMode && printUuid);
  }

}
