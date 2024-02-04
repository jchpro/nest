# Simple request logger (`morgan`) setup 

## Description

This utility simplifies setting up HTTP logger during application bootstrap.

## Installation

```shell
# Required peer dependencies
npm i morgan
# Main library, if not already installed
npm i @jchpro/nest-common
```

## Usage

```typescript
import { RequestLoggerFactory } from '@jchpro/nest-common/request-logger';

const app = await NestFactory.create(AppModule);
app.use(RequestLoggerFactory.create('dev'));
```

Factory accepts:

- predefined format, one of: `dev`, `short`, `tiny`, `combined` or `common`;
- `morgan.FormatFn` for custom formatting;
- `{ format: morgan.FormatFn; options: options: morgan.Options }` for custom formatting and options;
