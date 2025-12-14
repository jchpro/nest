import { FactoryProviderOptions } from '@jchpro/nest-common';
import { DynamicModule, FactoryProvider, Inject, Module, Optional, Provider, ValueProvider } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SINGLE_CONNECTION_SCHEMA_REFS_OPTIONS } from './consts/injection-tokens';
import { ReferencingDocInfo, ReferencingDocsLookupService } from './services/referencing-docs-lookup.service';
import { SchemaReferencesService } from './services/schema-references.service';

/**
 * This module will register all references between schemas in a single connection environment.
 */
@Module({})
export class SingleConnectionSchemaRefsModule {

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly refs: SchemaReferencesService,
    @Inject(SINGLE_CONNECTION_SCHEMA_REFS_OPTIONS) @Optional() private readonly options?: SingleConnectionSchemaRefsOptions,
  ) {
    const modelsToSkip = this.options?.skipModels ?? [];
    for (const [name, model] of Object.entries(this.connection.models)) {
      if (modelsToSkip.includes(name)) {
        continue;
      }
      this.refs.register(model.schema, name);
    }
  }

  static forRoot(options?: SingleConnectionSchemaRefsOptions): DynamicModule {
    return SingleConnectionSchemaRefsModule.initialize(SingleConnectionSchemaRefsModule.syncProvider(options));
  }

  static forRootAsync(options: FactoryProviderOptions<SingleConnectionSchemaRefsOptions>): DynamicModule {
    return SingleConnectionSchemaRefsModule.initialize(SingleConnectionSchemaRefsModule.asyncProvider(options));
  }

  private static syncProvider(options?: SingleConnectionSchemaRefsOptions): ValueProvider<SingleConnectionSchemaRefsOptions | undefined> {
    return {
      provide: SINGLE_CONNECTION_SCHEMA_REFS_OPTIONS,
      useValue: options
    };
  }

  private static asyncProvider(options: FactoryProviderOptions<SingleConnectionSchemaRefsOptions>): FactoryProvider<SingleConnectionSchemaRefsOptions | undefined> {
    return {
      provide: SINGLE_CONNECTION_SCHEMA_REFS_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject
    };
  }

  private static initialize(optionsProvider: Provider<SingleConnectionSchemaRefsOptions| undefined>): DynamicModule {
    return {
      module: SingleConnectionSchemaRefsModule,
      providers: [
        optionsProvider,
        ReferencingDocsLookupService,
        SchemaReferencesService
      ],
      exports: [
        ReferencingDocsLookupService,
        SchemaReferencesService
      ],
      global: true
    };
  }

}

export interface SingleConnectionSchemaRefsOptions {

  /**
   * List of model names to skip in the reference resolving process.
   */
  skipModels?: string[];

  /**
   * ID field name for of the documents.
   *
   * @default '_id'
   */
  idField?: string;

  /**
   * Factory for throwing error when {@link ReferencingDocsLookupService#assertUnreferenced} fails.
   */
  unrefAssertionErrorFactory?: (id: string, infos: ReferencingDocInfo[]) => any;

}
