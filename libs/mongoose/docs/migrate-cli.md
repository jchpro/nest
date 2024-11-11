# Mongo Migrate CLI

## Description

Migrate CLI is currently implemented in its most basic capability.

## Usage

### Setup

I'm not a fan of installing too many CLIs globally, so in this document I'll be showing example commands run using `npx`, assuming that the package is installed locally in your project.

```shell
npx mongo-migrate setup <applicationProject> <options...> 
```

This will add `mongoMigrate` section to the `package.json`, based on your input options. Please run the command with `--help` to get more info.

### Generate

```shell
npx mongo-migrate generate "Some descriptive name of the migration" 
```

This will generate the migration file in the project (`--project` option or uses the default one) and regenerate the "collector" file.

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
