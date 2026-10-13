# Mongo Migrate Tool

## Description

A small generator for migration files and for the "collector" file that lists them. The migrations themselves are run by `Migrator` (see below).

## Usage

### Generate

The package installs the `mongo-migrate-create` command. It takes three arguments: the directory with migrations, the collector file (must already exist) and the name of the package the generated files import from.

```shell
npx mongo-migrate-create src/migrations src/app.migrations.ts @jchpro/nest-mongoose
```

It asks for the name of the migration, creates the migration file and regenerates the collector file. Put the command into an npm script (the API does it as `npm run create-migration`).

### Running migrations on app startup

```typescript
// app.module.ts

// Default name of the "collector" file.
import migrations from './app.migrations';

@Module({
  imports: [
    // Import the Migration module with migrations
    MongoMigrateModule.withMigrations(migrations),
  ]
})
export class AppModule { }
```

```typescript
// main.ts

import { Migrator } from '@jchpro/nest-mongoose';

async function bootstrap() {
  // Prepare your app here
  const app = await NestFactory.create(AppModule);
  
  // Run database migrations `up`
  await new Migrator(app).up();
}
```

`withMigrations(migrations, options?)` accepts `MigrateOptions`: `collectionName` (the changelog collection, `changelog` by default) and `lockCollectionName` (`changelog-lock` by default).

### How migrations run

- A migration is a `Migration` (`up(db, client, app)`, `down` is not supported yet) wrapped with its `id` in a `MigrationWrapper`. The generated files and the collector do this for you.
- `Migrator.up()` takes a lock in the lock collection, so only one instance of the app migrates at a time (the others skip it), runs the migrations not yet recorded in the changelog collection, in the order of the collector, and releases the lock.
- A migration recorded under a different ID than the one at its position in the collector makes the run fail: add new migrations at the end, never reorder them.
- A failure is logged and rethrown, so `up()` rejects and the app does not start on a half-migrated database (the lock is released anyway). Migrations applied before the failing one stay recorded in the changelog. Skipping the run because another instance holds the lock is not a failure, `up()` returns normally.
