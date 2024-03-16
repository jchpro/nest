import { DynamicModule, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ChangelogLock, ChangelogLockSchema } from "./schemas/changelog-lock.schema";
import { Changelog, ChangelogSchema } from "./schemas/changelog.schema";
import { MigrateService } from "./services/migrate.service";
import { MigrateOptions, MigrationWrapper } from './types/migrations';

@Module({})
export class MongoMigrateModule {

  static withMigrations(
    migrations: MigrationWrapper[],
    options?: MigrateOptions,
  ): DynamicModule {
    return {
      module: MongoMigrateModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: Changelog.name,
            schema: ChangelogSchema,
            collection: options?.collectionName ?? 'changelog'
          },
          {
            name: ChangelogLock.name,
            schema: ChangelogLockSchema,
            collection: options?.lockCollectionName ?? 'changelog-lock'
          }
        ])
      ],
      providers: [
        {
          provide: MigrateService.MIGRATIONS,
          useValue: migrations,
        },
        MigrateService,
      ],
    };
  }

}
