# Swagger UI setup and OpenAPI utilities

## Description

This utility lets you quickly set up Swagger UI during application bootstrap.

You'll also find some utility decorators here. 

## Installation

```shell
# Required peer dependencies
npm i @nestjs/swagger
# Main library, if not already installed
npm i @jchpro/nest-common
```

## Usage

### SwaggerUi

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swaggerUi = SwaggerUiFactory.create(app, /* DocumentBuilder().build() */);
  swaggerUi.serve('docs', { serveDoc: true });
}
```

Swagger UI will be available at `/docs` endpoint, and the JSON document at `/docs/doc.json`. 

Refer to `SwaggerUiOptions` to see all options.

### Utility classes

- `PaginationParams` and `SortingParams` classes ready to use as DTOs when used with OpenAPI
- `SortingType` factory returning class ready to use as DTO with full typing and OpenAPI spec applied

### Decorators

- `@ApiEnum`, `@ApiEnumOptional`, `reusableApiEnum()` - mechanism for referencing always the same enum entity in the OpenAPI document, similar to `enumAsRef` option used in Spring framework
- `@ApiSelfTag` - adds a tag with the name of the class it's being applied to
- `@QueryResultResposne` - applies `ApiOkResponse` decorator and applies interceptor which handles `QueryResult`, passing through their configuration
- `ValidateFactory` - returns decorator for use at the app-level, which applies `@ApiBadRequestResponse` and `@UsePipes` with validation pipe

Please refer to code comments for additional information.
