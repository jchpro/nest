import { ValidateFactory } from '@jchpro/nest-common/openapi';
import { BadRequestException } from '@nestjs/common';

export const Validate = ValidateFactory(
  {
    description: 'Request validation failed'
  },
  {
    transform: true,
    transformOptions: {
      strategy: 'excludeAll',
      enableImplicitConversion: true
    },
    exceptionFactory: errors => {
      return new BadRequestException(
        'Validation failed: ' + errors.map(error => {
          return `[${error.property}] ${Object.values(error.constraints ?? {}).join(', ')}`
        }).join('; ')
      )
    }
  }
);
