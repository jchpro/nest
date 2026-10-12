import { type CaughtExceptionContext, type CaughtExceptionData } from '../../index.js';
import { type HttpException } from '@nestjs/common';
import { type HttpArgumentsHost } from '@nestjs/common/internal';

export type CaughtExceptionHttpContext = CaughtExceptionContext<
  HttpArgumentsHost,
  CaughtExceptionHttpData,
  HttpException
>;

export interface CaughtExceptionHttpData extends CaughtExceptionData {
  statusCode: number;
  path?: string;
}
