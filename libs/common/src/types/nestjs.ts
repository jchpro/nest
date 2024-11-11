import { FactoryProvider } from "@nestjs/common";

export type FactoryProviderOptions<T> = Pick<FactoryProvider<T>, 'useFactory' | 'inject'>;
