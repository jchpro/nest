import {
  ArgumentsHost,
  Catch,
  ContextType,
  ExceptionFilter,
  HttpStatus,
  INestApplication,
  Logger,
  LoggerService,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { HttpAdapterHost } from '@nestjs/core';
import { AbstractHttpAdapter } from '@nestjs/core/adapters/http-adapter';
import { randomUUID } from 'crypto';
import { GlobalExceptionHandlerOptions } from '../types/global-exception-handler-options';
import { CaughtExceptionHttpContext } from '../types/caught-exception-http-context';
import { CaughtExceptionData } from '../types/caught-exception-context';
import { ExceptionHandlerBehaviorHttp } from '../behaviors/exception-handler-behavior-http';
import { ExceptionLogArguments } from '../types/exception-handling.instructions';
import { ExceptionHandlerBehavior } from '../behaviors/exception-handler-behavior';

@Catch()
export class GlobalExceptionHandler
  implements ExceptionFilter<unknown>
{
  private readonly logger: LoggerService;
  private readonly unknownErrorName: string;

  private constructor(
    private readonly httpAdapter: AbstractHttpAdapter,
    private readonly behaviorHttp?: ExceptionHandlerBehaviorHttp,
    options?: GlobalExceptionHandlerOptions,
  ) {
    this.logger = options?.logger ?? new Logger('GlobalExceptionHandler');
    this.unknownErrorName = options?.unknownErrorName ?? 'Unknown';
    if (!(this.behaviorHttp /* && others in the future... */)) {
      throw Error('At least one exception handler context must be configured!');
    }
    const types: ContextType[] = [!!this.behaviorHttp ? 'http' : undefined]
      .filter(it => !!it) as ContextType[];
    this.logger.log(`Set up contexts: ${types.join(', ')}`);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const timestamp = GlobalExceptionHandler.getTimestamp();
    const contextType = host.getType();
    if (contextType === 'http' && this.behaviorHttp) {
      this.handleHttp(exception, timestamp, host.switchToHttp());
      return;
    }
    this.logger.warn(`Unsupported or unconfigured exception handler context: ${contextType}`, exception);
  }

  /**
   * Call inside the `bootstrap` function of your Nest.js app.
   */
  static setup(app: INestApplication,
               /**
                * Provide specific handler behavior implementations, or pass `true` to use the default ones.
                * You must configure at least one context, otherwise the setup will fail.
                */
               contexts: {
                 http?: ExceptionHandlerBehaviorHttp | true;
               },
               options?: GlobalExceptionHandlerOptions): void {
    app.useGlobalFilters(
      new GlobalExceptionHandler(
        app.get(HttpAdapterHost).httpAdapter,
        contexts.http === true
          ? new ExceptionHandlerBehaviorHttp()
          : contexts.http,
        options
      )
    );
  }

  private handleHttp(exception: unknown, timestamp: string, host: HttpArgumentsHost): void {
    const uuid = randomUUID();
    const path = this.httpAdapter.getRequestUrl(host.getRequest());
    let caught: CaughtExceptionHttpContext;
    if (this.behaviorHttp!.recognize(exception)) {
      caught = {
        exception,
        host,
        recognized: true,
        data: {
          error: exception.name,
          message: exception.message,
          stack: exception.stack,
          path,
          uuid,
          statusCode: exception.getStatus(),
          timestamp
        }
      };
    } else {
      const info = this.extractUnknownExceptionInfo(exception, this.behaviorHttp!);
      caught = {
        exception,
        host,
        recognized: false,
        data: {
          error: info.error,
          message: info.message,
          stack: info.stack,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          path,
          uuid,
          timestamp
        }
      };
    }
    const instructions = this.behaviorHttp!.instruct(caught);
    this.log(instructions.log);
    this.httpAdapter.reply(host.getResponse(), instructions.respondWith, caught.data.statusCode);
  }

  private log(args: ExceptionLogArguments): void {
    this.logger.error(...args);
  }

  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  private extractUnknownExceptionInfo(exception: unknown,
                                      behavior: ExceptionHandlerBehavior): Pick<CaughtExceptionData, 'error' | 'message' | 'stack'> {
    const unknownErrorName = behavior.unknownErrorName ?? this.unknownErrorName;
    if (typeof exception === 'string') {
      return { error: unknownErrorName, message: exception };
    }
    if (exception instanceof Error) {
      return {
        error: exception.name,
        message: exception.message,
        stack: exception.stack
      };
    }
    if (typeof exception === 'object') {
      const { name, error, message, stack } = exception as Record<any, any>;
      return {
        error: error ?? name ?? unknownErrorName,
        message: message ?? error,
        stack
      };
    }
    return { error: unknownErrorName };
  }

}
