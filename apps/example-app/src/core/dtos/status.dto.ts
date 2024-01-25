import { ApiEnum } from '@jchpro/nest-common/openapi';
import { ApiProperty } from '@nestjs/swagger';
import { Environment } from '../enums/environment.enum';

export class StatusDto {

  @ApiProperty()
  status: string;

  @ApiEnum(Environment)
  environment: Environment;

}
