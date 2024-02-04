import type {
  ApiProperty as ApiPropertyType,
  ApiTags as ApiTagsType,
  SwaggerModule as SwaggerModuleType,
} from '@nestjs/swagger';

let ApiProperty: typeof ApiPropertyType;
let ApiTags: typeof ApiTagsType;
let SwaggerModule: typeof SwaggerModuleType;

try {
  const ns = require('@nestjs/swagger');
  SwaggerModule = ns.SwaggerModule;
  ApiTags = ns.ApiTags;
  ApiProperty = ns.ApiProperty;
} catch (err) {
  console.error('Could not resolve `@nestjs/swagger` package, please run `npm i @nestjs/swagger`');
  throw err;
}

export { SwaggerModule, ApiTags, ApiProperty };
