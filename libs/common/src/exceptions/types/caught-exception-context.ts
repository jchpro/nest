/**
 * Caught exception context, based on which {@link ExceptionHandlerBehavior} must return specific handling instructions.
 * Exceptions can be "recognized" as concrete type `E`, which:
 *   - is context specific;
 *   - means resolved exception data will be better / more specific.
 */
export type CaughtExceptionContext<H = any, D extends CaughtExceptionData = CaughtExceptionData, E = unknown> = {
  host: H;
  data: D;
} & ({
  recognized: false;
  exception: unknown;
} | {
  recognized: true;
  exception: E;
})

/**
 * Basic caught exception data, common for all contexts.
 */
export interface CaughtExceptionData {
  error: string;
  timestamp: string;
  message?: string;
  uuid?: string;
  stack?: string;
}
