import type * as Morgan from 'morgan';
import { RequestLoggerConfig } from '../types/request-logger-config';
import { RequestLoggerFormat } from '../types/request-logger-format';

let morgan: Morgan.Morgan<any, any>;

try {
  morgan = require('morgan');
} catch (err) {
  console.error('Could not resolve `morgan` package, please run `npm i morgan`.');
  throw err;
}

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
