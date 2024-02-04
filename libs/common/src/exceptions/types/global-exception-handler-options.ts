import { LoggerService } from '@nestjs/common';

/**
 * Options for {@link GlobalExceptionHandler}
 */
export interface GlobalExceptionHandlerOptions {

  /**
   * Pass to use the logger instead of the default one.
   */
  readonly logger?: LoggerService;

  /**
   * Name for the unknown error, defaults to "Unknown" and can be overridden by specific {@link ExceptionHandlerBehavior#unknownErrorName}.
   */
  readonly unknownErrorName?: string;

}
