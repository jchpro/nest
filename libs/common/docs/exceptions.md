# All-in-one exception handler for Nest.js

## Description

The library exposes one `GlobalExceptionHandler` to handle them all (exceptions)!

Its behavior can be customized, but if you'd like something that works out-of-the-box, you'll find it as well.

## Usage

### Set it up and forget

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  GlobalExceptionHandler.setup(app, { http: true });
}
```

That's it. Your errors will be logged and the response object for thrown `HttpException` instances will look like this:

```json
{
  "error": "NotFoundException",
  "message": "Not Found",
  "path": "/dogs/doggo-1",
  "statusCode": 404,
  "timestamp": "2024-02-01T17:38:49.358Z"
}
```

Log entry:

```text
[Nest] 3052  - 01.02.2024, 18:38:49   ERROR [GlobalExceptionHandler] NotFoundException: Not Found
```

...or, for everything else...

```json
{
  "error": "InternalServerError",
  "statusCode": 500,
  "path": "/cats/kitty-1",
  "uuid": "3d29e075-bf6e-4169-a309-6a8ce930e77a",
  "timestamp": "2024-02-01T17:39:37.207Z"
}
```

with

```text
[Nest] 3052  - 01.02.2024, 18:39:37   ERROR [GlobalExceptionHandler] [3d29e075-bf6e-4169-a309-6a8ce930e77a] InternalServerError
```

Please refer to the comments for `ExceptionHandlerBehaviorHttp` to see how it works.

### Commonly used behavior

This one changes what's being logged base on the environment (production or not).

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  GlobalExceptionHandler.setup(app, {
    http: new CommonExceptionHandlerBehaviorHttp(isProductionMode)
  });
}
```

Again, refer to comment for `CommonExceptionHandlerBehaviorHttp` to see if it's right for you.

### Customization?

Yeah! Just extend `ExceptionHandlerBehavior`, implement abstract methods and your good to go.

All internal methods are `protected` so you can overwrite them in any combination, or just disregard them entirely.
What's important is that you return `ExceptionHandlingInstructions` in the `instruct` method.

### Supported contexts

Right now only `http` context is supported.
