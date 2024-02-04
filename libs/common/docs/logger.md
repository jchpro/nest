# Common Nest.js logger setup

## Description

This utility simplifies setting up loggers during application bootstrap, by providing simple logic to choose right log levels.

## Usage

```typescript
const app = await NestFactory.create(AppModule, {
  logger: LoggerFactory.create(LogLevels.DEVELOPMENT)
});
```

Refer to `LogLevels` enum to see what levels will be used.

You can pass everything `Nest.js` would accept in `NestFactory#create` option `logger`.
