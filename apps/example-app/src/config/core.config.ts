import { EnvProperty } from '@jchpro/nest-config';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Environment } from '../core/enums/environment.enum';

export class CoreConfig {

  @EnvProperty('NODE_ENV')
  @IsEnum(Environment)
  readonly environment: Environment;

  @EnvProperty('PORT')
  @IsNumber()
  readonly serverPort: number;

  @EnvProperty('MONGODB_URI')
  @IsString()
  readonly mongodbUri: string;

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
