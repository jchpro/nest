import type {
  ApiOkResponse as ApiOkResponseType,
  ApiBadRequestResponse as ApiBadRequestResponseType,
  ApiForbiddenResponse as ApiForbiddenResponseType,
  ApiProperty as ApiPropertyType,
  ApiPropertyOptional as ApiPropertyOptionalType,
  ApiPropertyOptions,
  ApiTags as ApiTagsType,
  IntersectionType as IntersectionTypeType,
  OmitType as OmitTypeType,
  SwaggerModule as SwaggerModuleType,
  getSchemaPath as getSchemaPathType
} from '@nestjs/swagger';

let ApiOkResponse: typeof ApiOkResponseType;
let ApiBadRequestResponse: typeof ApiBadRequestResponseType;
let ApiForbiddenResponse: typeof ApiForbiddenResponseType;
let ApiProperty: typeof ApiPropertyType;
let ApiPropertyOptional: typeof ApiPropertyOptionalType;
let ApiTags: typeof ApiTagsType;
let IntersectionType: typeof IntersectionTypeType;
let OmitType: typeof OmitTypeType;
let SwaggerModule: typeof SwaggerModuleType;
let getSchemaPath: typeof getSchemaPathType;

try {
  const ns = require('@nestjs/swagger');
  SwaggerModule = ns.SwaggerModule;
  ApiOkResponse = ns.ApiOkResponse;
  ApiBadRequestResponse = ns.ApiBadRequestResponse;
  ApiForbiddenResponse = ns.ApiForbiddenResponse;
  ApiTags = ns.ApiTags;
  ApiProperty = ns.ApiProperty;
  ApiPropertyOptional = ns.ApiPropertyOptional;
  IntersectionType = ns.IntersectionType;
  OmitType = ns.OmitType;
  getSchemaPath = ns.getSchemaPath;
} catch (err) {
  console.error('Could not resolve `@nestjs/swagger` package, please run `npm i @nestjs/swagger`');
  throw err;
}

export {
  SwaggerModule,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
  ApiPropertyOptions,
  IntersectionType,
  OmitType,
  getSchemaPath
};
