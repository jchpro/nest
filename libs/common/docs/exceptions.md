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
[Nest] 3052  - 01.02.2024, 18:39:37   ERROR [GlobalExceptionHandler] [3d29e075-bf6e-4169-a309-6a8ce930e77a] Error: connection to the database lost
```

The response of an unrecognized error says that something went wrong and gives the `uuid` to find it in the log, but never what it was: neither the name nor the message of the error
reach the client, only the log has them. An error's message can be anything (driver errors, file paths, queries), it is not something to hand to whoever made the request.

Please refer to the comments for `ExceptionHandlerBehaviorHttp` to see how it works.

### Validation errors

When Nest's `ValidationPipe` rejects a request, the response says what was wrong in `details`, one message per violated constraint
(the `message` of that exception is only "Bad Request Exception"):

```json
{
  "error": "BadRequestException",
  "message": "Bad Request Exception",
  "details": ["name should not be empty", "age must not be less than 0"],
  "path": "/dogs",
  "statusCode": 400,
  "timestamp": "2024-02-01T17:40:12.101Z"
}
```

Any recognized exception whose response body has a non-empty array of strings as its `message` gets `details`. Override `extractDetails(exception)`
of the behavior to find them somewhere else, or to leave them out. They are not written to the log.

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

In production mode it responds as described above. Otherwise the response of an unrecognized error carries its real name, message and stack trace (and no `uuid`), which is handy while developing.

Again, refer to comment for `CommonExceptionHandlerBehaviorHttp` to see if it's right for you.

### Customization?

Yeah! Just extend `ExceptionHandlerBehavior`, implement abstract methods and your good to go.

All internal methods are `protected` so you can overwrite them in any combination, or just disregard them entirely.
What's important is that you return `ExceptionHandlingInstructions` in the `instruct` method.

### Types

- `GlobalExceptionHandlerOptions` (third argument of `setup`): `logger` replaces the default logger, `unknownErrorName` is the `error` name used for thrown values that aren't errors (`"Unknown"` by default; a behavior can override it)
- `CaughtExceptionHttpContext` is what a behavior's `instruct` receives: the `host`, the `exception`, whether it was `recognized` (an `HttpException`), and `data` (`CaughtExceptionHttpData`: `error`, `message`, `details`, `statusCode`, `path`, `timestamp`, `uuid`, `stack`). Mutate `data` to change the response, e.g. to translate the message. The generic `CaughtExceptionContext` and `CaughtExceptionData` are the base of it
- `ExceptionHandlingInstructions` is what `instruct` returns: `log` (`ExceptionLogArguments`, the message and optionally the stack trace for the logger) and `respondWith` (the response body)

### Supported contexts

Right now only `http` context is supported.
