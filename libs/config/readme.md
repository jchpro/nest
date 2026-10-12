# Config loading utility for Nest.js

Yet another way of loading config in Nest.js.

## Usage

### Create config classes

Create regular TypeScript classes and mark the properties you want mapped from environment variables.

```typescript

export enum Environment {
  Development = "development",
  Production = "production"
}

export class ServerConfig {

  // Providing environment variable name explicitly
  @IsEnum(Environment)
  @EnvProperty('NODE_ENV')
  readonly environment: Environment;

  // `SERVER_PORT` will be used as an environment variable name
  @IsNumber()
  @EnvProperty()
  readonly SERVER_PORT: number;
}

export class DatabaseConfig {

  @Matches(/^(mongodb:(?:\/{2})?)((\w+?):(\w+?)@|:?@?)(\w+?):(\d+)\/([\w-]+?)$/)
  @EnvProperty('APP_MONGO_URI')
  readonly mongoUri: string;
  
}

```

> :warning: You have to use at least one `class-validator` decorator per class. 

### Import `ConfigModule`

In `AppModule`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ServerConfig, DatabaseConfig]
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

You can customize behavior of almost any initialization step performed by external packages, as well as provide custom error to throw when validation fails. Check `ConfigModuleOptions` for more info.

### Use your classes in the app

Your instantiated config classes are available via good old dependency injection:

```typescript

@Injectable()
export class DatabaseConfigService {

  constructor(
    config: DatabaseConfig
  ) {
    console.log(config.mongoUri); // => "mongodb://localhost:27017/my-database"
  }

}
```

Original config object resolved by Nest is passed through the module instantiation process, so all environment variables will be available via `ConfigService#get`, though without typing:

```typescript

@Injectable()
export class ServerConfigService {

  constructor(
    configService: ConfigService
  ) {
    const env = configService.get('NODE_ENV');      // type = any
    console.log(env);                               // => development
  }

}

```

### Use in `main.ts`

Since initialization of the module happens at the decorators level, your config classes are available even before creation of the app in `main.ts`!

```typescript
async function bootstrap() {
  const config = ConfigResolver.get(AppConfig)!;
  
  // Use your config even during `AppModule` creation.
  const app = await NestFactory.create(AppModule);
  await app.listen(config.serverPort);
}
bootstrap();
```

### A note on timing (and testing)

Config classes resolve as soon as the module whose `@Module` decorator calls `ConfigModule.forRoot(...)` is first **imported** - not when Nest later builds/compiles the module graph (e.g. in `NestFactory.create()` or `Test.createTestingModule().compile()`). This is why `ConfigResolver.get(...)` already works before `main.ts` even creates the app (see above): decorator arguments, including `ConfigModule.forRoot(...)` calls nested inside them, run synchronously the moment the class is declared.

The flip side: mutating `process.env` *after* that import has already happened does nothing - the values were already read and validated. This mostly shows up in tests that want a different setting for a single test file (e.g. a module-wide default set by a shared setup file, overridden per file): if the file statically imports anything that transitively imports the module declaring `ConfigModule.forRoot(...)`, the import (and the config read) happens before any of that file's own code, including a `beforeAll` hook, gets a chance to run. Overriding `process.env` first requires deferring that import - e.g. with a dynamic `import()` called after the override, instead of a static one at the top of the file.
