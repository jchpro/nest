import { ApiSelfTag } from '@jchpro/nest-common/openapi';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { CoreConfig } from '../../config/core.config';
import { StatusDto } from '../dtos/status.dto';
import { Environment } from '../enums/environment.enum';

@Controller('status')
@ApiSelfTag()
export class StatusController {

  private readonly environment: Environment;

  constructor(
    config: CoreConfig
  ) {
    this.environment = config.environment;
  }

  @Get()
  getStatus(): StatusDto {
    return {
      status: 'ok',
      environment: this.environment
    };
  }

  @Get('throw/unknown')
  throwUnknown() {
    throw `I'm but a simple string thrown on the wind!`;
  }

  @Get('throw/mock')
  throwMock() {
    throw new Error('This is mock error!');
  }

  @Get('throw/404')
  throwError404() {
    throw new NotFoundException();
  }

}
