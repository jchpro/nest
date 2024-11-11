import { FactoryProviderOptions } from '@jchpro/nest-common';
import { DynamicModule, FactoryProvider, Module, Provider, ValueProvider } from "@nestjs/common";
import { MONGOOSE_CRUD_OPTIONS } from "./consts/injection-tokens";
import { QueryService } from "./services/query.service";
import { CrudOptions } from "./types/crud";

@Module({})
export class MongooseCrudModule {

  static forFeature(options?: CrudOptions): DynamicModule {
    return MongooseCrudModule.initialize(false, MongooseCrudModule.syncProvider(options));
  }

  static forRoot(options?: CrudOptions): DynamicModule {
    return MongooseCrudModule.initialize(true, MongooseCrudModule.syncProvider(options));
  }

  static forFeatureAsync(options: FactoryProviderOptions<CrudOptions>): DynamicModule {
    return MongooseCrudModule.initialize(false, MongooseCrudModule.asyncProvider(options));
  }

  static forRootAsync(options: FactoryProviderOptions<CrudOptions>): DynamicModule {
    return MongooseCrudModule.initialize(true, MongooseCrudModule.asyncProvider(options));
  }

  private static syncProvider(options?: CrudOptions): ValueProvider<CrudOptions | undefined> {
    return {
      provide: MONGOOSE_CRUD_OPTIONS,
      useValue: options
    }
  }

  private static asyncProvider(options: FactoryProviderOptions<CrudOptions>): FactoryProvider<CrudOptions | undefined> {
    return {
      provide: MONGOOSE_CRUD_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject
    };
  }

  private static initialize(global: boolean,
                            optionsProvider: Provider<CrudOptions | undefined>): DynamicModule {
    return {
      module: MongooseCrudModule,
      providers: [
        optionsProvider,
        QueryService
      ],
      exports: [
        QueryService
      ],
      global
    };
  }

}
