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
