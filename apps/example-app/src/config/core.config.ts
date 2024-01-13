import { EnvProperty } from '@jchpro/nest-config';
import { IsEnum, IsNumber } from 'class-validator';
import { Environment } from '../core/environment.enum';

export class CoreConfig {

  @EnvProperty('NODE_ENV')
  @IsEnum(Environment)
  readonly environment: Environment;

  @EnvProperty('PORT')
  @IsNumber()
  readonly serverPort: number;

  get isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT;
  }

  get isTest(): boolean {
    return this.environment === Environment.TEST;
  }

  get isProduction(): boolean {
    return this.environment === Environment.PRODUCTION;
  }

}
