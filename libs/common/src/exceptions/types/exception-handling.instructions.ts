/**
 * Instruction on how to log the exception and with what object to respond.
 */
export interface ExceptionHandlingInstructions {
  readonly log: ExceptionLogArguments;
  /**
   * Logger method to log with, defaults to `error`.
   */
  readonly level?: ExceptionLogLevel;
  readonly respondWith: object;
}

/**
 * Arguments for the logger, second arguments is optional, usually contains the error's stacktrace.
 */
export type ExceptionLogArguments = [string, any?];

/**
 * Logger methods an exception can be logged with, the same as Nest's `LogLevel`.
 */
export type ExceptionLogLevel = 'log' | 'debug' | 'verbose' | 'warn' | 'error' | 'fatal';
