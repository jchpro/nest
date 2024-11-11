/**
 *
 */
export class QueryResult<T> {

  constructor(
    readonly items: T[],
    readonly total: number,
    readonly offset?: number,
    readonly limit?: number
  ) { }

  map<D = any>(mapFn: (item: T) => D): D[] {
    return this.items.map(mapFn);
  }

}
