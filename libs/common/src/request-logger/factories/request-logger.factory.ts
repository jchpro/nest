import morgan from 'morgan';
import type * as Morgan from 'morgan';
import { type RequestLoggerConfig } from '../types/request-logger-config.js';
import { type RequestLoggerFormat } from '../types/request-logger-format.js';

export const RequestLoggerFactory = {

  /**
   * Sets up `morgan` request logger.
   * Returns middleware function to pass to `app.use` in `main.ts`.
   */
  create: function(config?: RequestLoggerConfig): any {
    if (!config) {
      return;
    }
    const morganFormat:
      | RequestLoggerFormat
      | Morgan.FormatFn<any, any>
      | undefined =
      typeof config === 'string' || typeof config === 'function'
      ? config
      : config?.format;
    const morganOptions =
      typeof config === 'string' || typeof config === 'function'
      ? undefined
      : config.options;
    return config
           ? morgan(morganFormat as Morgan.FormatFn<any, any>, morganOptions)
           : undefined;
  }
}
