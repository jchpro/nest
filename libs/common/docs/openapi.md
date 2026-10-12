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
- `@ApiQueryResultResponse(type, options?)` - applies `ApiOkResponse` and an interceptor which handles a returned `QueryResult`: responds with the items, puts the total count in the `X-Total-Count` header (name and header docs configurable with `totalHeader`), and can map the items (`map`) and add `extraHeaders` or other `response` options
- `ValidateFactory` - returns decorator for use at the app-level, which applies `@ApiBadRequestResponse` and `@UsePipes` with validation pipe

- `RequireAuthorizationFactory(forbiddenOptions?)` - returns a decorator which attaches the required permissions (for the authorization mechanism, see [Auth](./auth.md)) and documents the `403` response

Please refer to code comments for additional information.

### Polymorphic models

`PolymorphismApiHelper<T>` extends `PolymorphismHelper` (see [Utilities](./utilities.md#polymorphic-models)) with an `ApiProperty` decorator
which documents the property as `oneOf` the registered sub types, with a `discriminator` mapping.
Remember to register the sub types with `@ApiExtraModels` so their schemas exist in the document.

```typescript
export const PetPolymorphism = new PolymorphismApiHelper<PetType>('type', PetDto);
PetPolymorphism.register(PetType.CAT, CatDto);
PetPolymorphism.register(PetType.DOG, DogDto);

@ApiExtraModels(CatDto, DogDto)
export class OwnerDto {
  @PetPolymorphism.ApiProperty({ required: true, isArray: false }) // both are the defaults
  @PetPolymorphism.Type()
  pet!: CatDto | DogDto;
}
```
