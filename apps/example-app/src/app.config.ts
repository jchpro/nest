import { RequestLoggerFormat } from '@jchpro/nest-common/request-logger';
import { EnvProperty } from '@jchpro/nest-config';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
}

/**
 * Environment variables of the app, validated at startup by `ConfigModule` (see `AppModule`).
 */
export class AppConfig {
  @EnvProperty('NODE_ENV')
  @IsEnum(Environment)
  readonly environment!: Environment;

  @EnvProperty('PORT')
  @IsInt()
  @Min(1)
  @Max(65535)
  readonly port!: number;

  @EnvProperty('MONGODB_URI')
  @IsString()
  @IsNotEmpty()
  readonly mongoUri!: string;

  // `RequestLoggerFormat` is a real object, so it can be passed to `IsEnum`
  @EnvProperty('REQUEST_LOG_FORMAT')
  @IsEnum(RequestLoggerFormat)
  readonly requestLogFormat!: RequestLoggerFormat;
}
