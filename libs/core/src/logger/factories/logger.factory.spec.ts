import { LogLevel } from '@nestjs/common';
import { LogLevels } from '@jchpro/nest-core';
import { LoggerFactory } from './logger.factory';

describe('LoggerFactory', () => {
  it('should produce DEBUG log levels for `LogLevels.DEBUG`', () => {
    // When, then
    const levels = LoggerFactory.create(LogLevels.DEBUG);
    expect(levels).toEqual(['error', 'warn', 'log', 'verbose', 'debug']);
  });

  it('should produce DEVELOPMENT log levels for `LogLevels.DEVELOPMENT`', () => {
    // When, then
    const levels = LoggerFactory.create(LogLevels.DEVELOPMENT);
    expect(levels).toEqual(['error', 'warn', 'log', 'verbose']);
  });

  it('should produce PRODUCTION log levels for `LogLevels.PRODUCTION`', () => {
    // When, then
    const levels = LoggerFactory.create(LogLevels.PRODUCTION);
    expect(levels).toEqual(['error', 'warn', 'log']);
  });

  it('should pass through any other config not handled by the function', () => {
    // Given
    const loggerService = class LoggerService {
      /* Imagine! */
    } as any;

    // When, then
    let logger = LoggerFactory.create(loggerService);
    expect(logger).toBe(loggerService);

    // Given
    const logLevels: LogLevel[] = ['log', 'error'];

    // When, then
    logger = LoggerFactory.create(logLevels);
    expect(logger).toEqual(logLevels);

    // When, then
    logger = LoggerFactory.create(false);
    expect(logger).toBe(false);
  });
});
