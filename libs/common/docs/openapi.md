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

### Decorators

- `@ApiEnum`, `@ApiEnumOptional`, `reusableApiEnum()` - mechanism for referencing always the same enum entity in the OpenAPI document, similar to `enumAsRef` option used in Spring framework
- `@ApiSelfTag` - adds a tag with the name of the class it's being applied to

Please refer to code comments for additional information.
