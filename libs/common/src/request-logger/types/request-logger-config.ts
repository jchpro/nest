import { type FormatFn, type Options } from 'morgan';
import { type RequestLoggerFormat } from './request-logger-format.js';

/**
 * `morgan` predefined format or format function, optionally options.
 */
export type RequestLoggerConfig =
  | RequestLoggerFormat
  | FormatFn<any, any>
  | {
    readonly format: RequestLoggerFormat | FormatFn<any, any>;
    readonly options: Options<any, any>;
  };
