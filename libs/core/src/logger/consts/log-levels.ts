import { LogLevel } from '@nestjs/common';

const LOG_LEVELS: readonly LogLevel[] = ['error', 'warn', 'log', 'verbose', 'debug'];

export const DEBUG: LogLevel[] = LOG_LEVELS.slice(
  0,
  LOG_LEVELS.indexOf('debug') + 1,
);

export const DEVELOPMENT: LogLevel[] = LOG_LEVELS.slice(
  0,
  LOG_LEVELS.indexOf('verbose') + 1,
);

export const PRODUCTION: LogLevel[] = LOG_LEVELS.slice(
  0,
  LOG_LEVELS.indexOf('log') + 1,
);

export enum LogLevels {
  /**
   * error, warn, log
   */
  PRODUCTION = 'PRODUCTION',

  /**
   * error, warn, log, verbose
   */
  DEVELOPMENT = 'DEVELOPMENT',

  /**
   * error, warn, log, verbose, debug
   */
  DEBUG = 'DEBUG',
}
