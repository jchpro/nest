import * as Swagger from '@nestjs/swagger';
import type { ApiPropertyOptions } from '@nestjs/swagger';

export const SwaggerModule = Swagger.SwaggerModule;
export const ApiOkResponse = Swagger.ApiOkResponse;
export const ApiBadRequestResponse = Swagger.ApiBadRequestResponse;
export const ApiForbiddenResponse = Swagger.ApiForbiddenResponse;
export const ApiTags = Swagger.ApiTags;
export const ApiProperty = Swagger.ApiProperty;
export const ApiPropertyOptional = Swagger.ApiPropertyOptional;
export const IntersectionType = Swagger.IntersectionType;
export const OmitType = Swagger.OmitType;
export const getSchemaPath = Swagger.getSchemaPath;

export type { ApiPropertyOptions };
