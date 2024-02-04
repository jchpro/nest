import { RequestLoggerFormat } from "../types/request-logger-format";
import { RequestLoggerFactory } from "./request-logger.factory";

let morganFactoryArgs: any[] | undefined;

jest.mock('morgan', () => {
  return function (...args: any[]) {
    morganFactoryArgs = args;
    return () => {};
  };
});

describe('RequestLoggerFactory', () => {

  it('should return `undefined` for falsy config', () => {
    // When, then
    let middleware = RequestLoggerFactory.create(undefined);
    expect(middleware).toBe(undefined);

    // When, then
    middleware = RequestLoggerFactory.create(null as any);
    expect(middleware).toBe(undefined);

    // When, then
    middleware = RequestLoggerFactory.create('' as any);
    expect(middleware).toBe(undefined);
  });

  beforeEach(() => {
    morganFactoryArgs = undefined;
  });

  it('should instantiate `morgan` middleware with any predefined format passed', () => {
    // Given
    const availableFormats: RequestLoggerFormat[] = [
      'dev',
      'tiny',
      'short',
      'common',
      'combined',
    ];

    for (const format of availableFormats) {
      // When, then
      const middleware = RequestLoggerFactory.create(format);
      expect(typeof middleware).toBe('function');
      expect(morganFactoryArgs).toEqual([format, undefined]);
    }
  });

  it('should instantiate `morgan` middleware with format function passed', () => {
    // Given
    const formatFn = function mockFormatFn() {};

    // When, then
    const middleware = RequestLoggerFactory.create(formatFn as any);
    expect(typeof middleware).toBe('function');
    expect(morganFactoryArgs).toEqual([formatFn, undefined]);
  });

  it('should instantiate `morgan` middleware with format function and options passed', () => {
    // Given
    const format = function mockFormatFn() {};
    const options = { beGood: true };

    // When, then
    const middleware = RequestLoggerFactory.create({ format, options } as any);
    expect(typeof middleware).toBe('function');
    expect(morganFactoryArgs).toEqual([format, options]);
  });
});
