# Nest.js config loading utility

Yet another way of loading config in Nest.js.

## Description

This library is heavily inspired by solution described in [Nest.js docs](https://docs.nestjs.com/techniques/configuration#custom-validate-function).

Basically it does three things:

- reads config from environment variables just like [Nest's `ConfigModule` would](https://docs.nestjs.com/techniques/configuration#getting-started);
- with help from `class-transformer` creates strongly-typed, injectable class instances with properties mapped from environment variables;
- using the power of `class-validator` validates these variables.

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
      classes: [ServerConfig, DatabaseConfig]
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
