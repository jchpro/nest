# Utilities

Small helpers exported from the main entry point, `@jchpro/nest-common`.

## DTO transformations

Decorators for `class-transformer`, applied when plain data is turned into a class instance.

- `@CoerceArray()` - wraps a single value in an array. Needed for query-string arrays: Express only produces an array when the key repeats (`?id=a&id=b`), `?id=a` gives a bare string, which fails `class-validator`'s `each: true`.
- `@CoerceBoolean({ optional? })` - turns a query-string or env value into a boolean: numeric strings are `true` when greater than 0, other strings only when they equal `true` (case-insensitive, trimmed). With `optional: true` a missing value stays `undefined`.

```typescript
export class ListDto {
  @IsOptional()
  @IsString({ each: true })
  @CoerceArray()
  tags?: string[];

  @IsOptional()
  @CoerceBoolean({ optional: true })
  archived?: boolean;
}
```

## Polymorphic models

`PolymorphismHelper<T>` registers sub types of a base class under values of a discriminator property, and returns a
configured `@Type` decorator of `class-transformer`, so nested objects are transformed into the right sub class.

```typescript
export const PetPolymorphism = new PolymorphismHelper<PetType>('type', PetDto);
PetPolymorphism.register(PetType.CAT, CatDto);
PetPolymorphism.register(PetType.DOG, DogDto);

export class OwnerDto {
  @PetPolymorphism.Type({ keepDiscriminatorProperty: true }) // `true` is the default
  pet!: CatDto | DogDto;
}
```

Registering a value twice logs a warning and keeps the first sub type. For the OpenAPI side see `PolymorphismApiHelper` in [OpenAPI utils](./openapi.md).

## Validation errors

`createPathErrors(errors, allMessages?)` flattens `class-validator`'s nested `ValidationError[]` into
`PathValidationError[]` (`{ path: 'address.street', constraints: [...] }`). Pass an array as the second argument to also collect all the constraint messages.

## Other

- `sleep(ms)` - promise resolved after the given number of milliseconds.
- `FactoryProviderOptions<T>` - the `useFactory` and `inject` part of Nest's `FactoryProvider`, handy for `forRootAsync`-style module APIs.
- Node.js helpers, mostly for CLIs and scripts: `readJsonObject`, `writeJsonObject`, `exists(path, 'file' | 'dir'?)`, `copyFiles`, `createPaths`, `readDirFiles(dir, ext)`, `readlineQuestion(question)` and `prepareCommand(command)` (appends `.cmd` on Windows, for spawning `npm` and friends).
