const resolvedConfigClasses = new Map<any, any>();

export function storeResolvedConfig(klass: any, instance: any) {
  resolvedConfigClasses.set(klass, instance);
}

export const ConfigResolver = {

  /**
   * Returns config class instance resolved during {@link ConfigModule} initialization.
   */
  get<T>(klass: new (...args: any[]) => T): T | undefined {
    return resolvedConfigClasses.get(klass);
  },
};
