# Utilities for Mongoose

## Description

## Decorators

- `@AppSchema` - returned by a factory function, lets you set some defaults which will be applied for each schema
- `@MongoIdParam` - returned by a factory function, will validate Mongo ID parameter and throw any error you wish

## Queries

- `QueryExecutor` - holds the query data and executes it for a given Mongoose model
- `QueryService` - prepares `QueryExectuor` passing global config

## Various types

Mostly CRUD related.
