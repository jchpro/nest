/**
 * Instruction on how to log the exception and with what object to respond.
 */
export interface ExceptionHandlingInstructions {
  readonly log: ExceptionLogArguments;
  readonly respondWith: object;
}

/**
 * Arguments for the logger, second arguments is optional, usually contains the error's stacktrace.
 */
export type ExceptionLogArguments = [string, any?];
