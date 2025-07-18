import { BadRequestException, Param, PipeTransform } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';
import { isMongoId } from 'class-validator';

/**
 * Returns parameter decorator which validates if given value is Mongo ID.
 * Passes any provided pipes to the inner `Param` decorator.
 */
export function MongoIdParamFactory(badRequestFactory?: (value: unknown) => any) {
  class MongoIdValidationPipe implements PipeTransform {
      transform(value: unknown) {
        if (!isMongoId(value)) {
          if (badRequestFactory) {
            throw badRequestFactory(value);
          }
          throw new BadRequestException(`'${value}' is not a valid Mongo ID`);
        }
        return value as string;
      }
  }
  return function MongoIdParam(property: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]) {
    return Param(property, MongoIdValidationPipe, ...pipes);
  }
}
