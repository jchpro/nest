# Common parts for the Nest.js apps

Typical parts for the typical Nest.js apps, just the way I like'em.

## Description

You'll find common things, like loggers, exceptions handlers and various other utilities for Nest.js apps.

I imagine it will grow alongside the projects I'm doing on the side, so expect more and more stuff appearing here with time.

## Installation

Required peer dependencies are:

- `@nestjs/common`

```shell
npm i @jchpro/nest-common
```

:warning: Functionalities might require additional peer dependencies, please refer to the specific functionality documentation. 

## Usage

What do you need?

- [Logger](./docs/logger) - quick setup of the simplest Nest.js logger
- [Request logger](./docs/request-logger) - quick setup of the `morgan` request logger
- [Exceptions handler](./docs/exceptions.md) - global exceptions handler
- [OpenAPI utils](./docs/openapi.md) - quick setup of the Swagger UI, few other utilities

