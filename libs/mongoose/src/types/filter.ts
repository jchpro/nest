import type { Query } from 'mongoose';

/**
 * Query filter that is the same type on Mongoose 8 (`FilterQuery`) and Mongoose 9 (`QueryFilter`), which renamed it.
 * Taken from `Query.getFilter()`, so it follows whichever Mongoose the app has installed.
 */
export type MongooseFilter<T = any> = ReturnType<Query<any, T>['getFilter']>;
