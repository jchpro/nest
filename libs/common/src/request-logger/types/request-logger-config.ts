import { FormatFn, Options } from 'morgan';
import { RequestLoggerFormat } from './request-logger-format';

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
