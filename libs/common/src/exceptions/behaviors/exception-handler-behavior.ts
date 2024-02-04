import { CaughtExceptionContext, CaughtExceptionData } from '../types/caught-exception-context';
import { ExceptionHandlingInstructions, ExceptionLogArguments } from '../types/exception-handling.instructions';

/**
 * Define exception handling behavior for given context.
 */
export abstract class ExceptionHandlerBehavior<C extends CaughtExceptionContext = CaughtExceptionContext, E = unknown> {

  /**
   * Handler will set {@link CaughtExceptionContext#recognized} based on the answer.
   */
  abstract recognize(exception: unknown): exception is E;

  /**
   * Handler will log the error and respond with given context based on the returned instructions.
   */
  abstract instruct(caught: C): ExceptionHandlingInstructions;

  /**
   * Unrecognized errors, which names can't be resolved otherwise will have {@link CaughtExceptionData#error} set to this value.
   */
  abstract unknownErrorName?: string;

  /**
   * Returns only the main log message as error log arguments.
   */
  protected recognizedLogArguments({ logMessage }: {
    logMessage: string;
    exception: E;
    data: C['data'];
  }): ExceptionLogArguments {
    return [logMessage];
  }

  /**
   * Returns the main log message as error log first argument, and stringified `exception` as second,
   * but only if it isn't a string itself, because that means this string had been already included in `logMessage`.
   */
  protected unrecognizedLogArguments({ logMessage, data, exception }: {
    logMessage: string;
    exception: unknown;
    data: C['data'];
  }): ExceptionLogArguments {
    return [
      logMessage,
      data.stack ?? (typeof exception === 'string' ?
        undefined : (exception as object).toString())
    ];
  }

  /**
   * Strips the UUID and / or stacktrace from the response object, based on the passed options.
   */
  protected prepareResponseObject(data: CaughtExceptionData,
                                  { uuid, stack }: { uuid: boolean; stack: boolean }): CaughtExceptionData {
    return {
      ...data,
      uuid: uuid ? data.uuid : undefined,
      stack: stack ? data.stack : undefined
    };
  }

  /**
   * Returns the main error log message, built from:
   *   - error name;
   *   - error message, if defined;
   *   - UUID prefix, if `printUuid` is set to `true`.
   */
  protected getLogMessage(data: CaughtExceptionData,
                          printUuid: boolean): string {
    const uuidPart = printUuid && data.uuid ? `[${data.uuid}] ` : '';
    const errorPart = `${uuidPart}${data.error}`;
    return data.message ? `${errorPart}: ${data.message}` : errorPart;
  }

}
