import { ExceptionHandlerBehaviorHttp } from './exception-handler-behavior-http';
import { CaughtExceptionData } from '../types/caught-exception-context';
import { ExceptionHandlingInstructions } from '../types/exception-handling.instructions';
import { CaughtExceptionHttpData } from '../types/caught-exception-http-context';

/**
 * Common behavior for exception handler in HTTP context:
 *   - unrecognized errors will have UUID attached to the response object, and logged in `productionMode`;
 *   - stacktrace will be attached to the response object only when not in `productionMode`;
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
      respondWith: this.prepareResponseObject(data, {
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
