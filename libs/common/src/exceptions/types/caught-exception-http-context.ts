import { CaughtExceptionContext, CaughtExceptionData } from '@jchpro/nest-common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { HttpException } from '@nestjs/common';

export type CaughtExceptionHttpContext = CaughtExceptionContext<
  HttpArgumentsHost,
  CaughtExceptionHttpData,
  HttpException
>;

export interface CaughtExceptionHttpData extends CaughtExceptionData {
  statusCode: number;
  path?: string;
}
