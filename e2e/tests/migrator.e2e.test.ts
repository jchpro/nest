import { type Migration, MigrationWrapper, MongoMigrateModule, Migrator } from '@jchpro/nest-mongoose';
import { type INestApplication } from '@nestjs/common';
import { MongooseModule, type MongooseModuleOptions } from '@nestjs/mongoose';
import { type Connection } from 'mongoose';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './helpers/app.js';
import { uniqueDatabaseUri } from './helpers/mongo.js';

describe('Migrator', () => {
  const apps: INestApplication[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  /** Starts an "instance" of the app against the database, like a restart of a real one. */
  async function startApp(uri: string, migrations: MigrationWrapper[], mongooseOptions?: MongooseModuleOptions) {
    const { app } = await createApp({
      imports: [MongooseModule.forRoot(uri, mongooseOptions), MongoMigrateModule.withMigrations(migrations)],
    });
    apps.push(app);
    return app;
  }

  /** A migration recording that it ran, in a collection of its own. */
  function recording(id: string, options?: { fail?: Error; delayMs?: number }): MigrationWrapper {
    const migration: Migration = {
      async up(db) {
        if (options?.delayMs) {
          await new Promise((resolve) => setTimeout(resolve, options.delayMs));
        }
        if (options?.fail) {
          throw options.fail;
        }
        await db.collection('ran').insertOne({ id });
      },
    };
    return new MigrationWrapper(id, migration);
  }

  const connectionOf = (app: INestApplication) => app.get<Connection>('DatabaseConnection');

  const ran = async (app: INestApplication) => {
    const docs = await connectionOf(app).db!.collection('ran').find().toArray();
    return docs.map((doc) => doc.id as string);
  };

  const changelog = async (app: INestApplication) => {
    const docs = await connectionOf(app).db!.collection('changelog').find().sort({ applied: 1 }).toArray();
    return docs.map((doc) => doc.identifier as string);
  };

  const lock = (app: INestApplication) => connectionOf(app).db!.collection('changelog-lock').findOne();

  it('runs the migrations in order, records them and releases the lock', async () => {
    const app = await startApp(uniqueDatabaseUri('migrator'), [recording('m1'), recording('m2'), recording('m3')]);

    await new Migrator(app).up();

    expect(await ran(app)).toEqual(['m1', 'm2', 'm3']);
    expect(await changelog(app)).toEqual(['m1', 'm2', 'm3']);
    expect(await lock(app)).toMatchObject({ locked: false });
  });

  it('runs each migration once, also across restarts', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const first = await startApp(uri, [recording('m1')]);
    await new Migrator(first).up();
    await new Migrator(first).up();

    const restarted = await startApp(uri, [recording('m1'), recording('m2')]);
    await new Migrator(restarted).up();

    expect(await ran(restarted)).toEqual(['m1', 'm2']);
    expect(await changelog(restarted)).toEqual(['m1', 'm2']);
  });

  it('skips the run without failing when another instance holds the lock', async () => {
    const app = await startApp(uniqueDatabaseUri('migrator'), [recording('m1')]);
    await connectionOf(app).db!.collection('changelog-lock').insertOne({ locked: true, processId: 1 });

    await expect(new Migrator(app).up()).resolves.toBeUndefined();

    expect(await ran(app)).toEqual([]);
    // Not ours to release
    expect(await lock(app)).toMatchObject({ locked: true, processId: 1 });
  });

  it('lets only one of the instances starting at the same time run the migrations', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const migrations = () => [recording('slow', { delayMs: 300 })];
    const [a, b] = await Promise.all([startApp(uri, migrations()), startApp(uri, migrations())]);

    await Promise.all([new Migrator(a).up(), new Migrator(b).up()]);

    expect(await ran(a)).toEqual(['slow']);
    expect(await changelog(a)).toEqual(['slow']);
  });

  it('lets only one of many instances starting at the same time run the migrations, whatever the timing', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const instances = await Promise.all(Array.from({ length: 5 }, () => startApp(uri, [recording('slow', { delayMs: 200 })])));

    await Promise.all(instances.map((app) => new Migrator(app).up()));

    expect(await ran(instances[0])).toEqual(['slow']);
    expect(await connectionOf(instances[0]).db!.collection('changelog-lock').countDocuments()).toBe(1);
  });

  it('keeps the lock atomic when the application builds no indexes on its own (autoIndex off)', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const options = { autoIndex: false };
    const [a, b] = await Promise.all([
      startApp(uri, [recording('slow', { delayMs: 300 })], options),
      startApp(uri, [recording('slow', { delayMs: 300 })], options),
    ]);

    await Promise.all([new Migrator(a).up(), new Migrator(b).up()]);

    expect(await ran(a)).toEqual(['slow']);
  });

  it('takes over the lock document of an earlier version, which has no key', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const app = await startApp(uri, [recording('m1')]);
    await connectionOf(app).db!.collection('changelog-lock').insertOne({ locked: false, processId: 1 });

    await new Migrator(app).up();

    expect(await ran(app)).toEqual(['m1']);
    expect(await connectionOf(app).db!.collection('changelog-lock').countDocuments()).toBe(1);
    expect(await lock(app)).toMatchObject({ locked: false, key: expect.any(String) });
  });

  it('can run again after the previous run released the lock', async () => {
    const app = await startApp(uniqueDatabaseUri('migrator'), [recording('m1')]);
    const migrator = new Migrator(app);

    await migrator.up();
    await migrator.up();

    expect(await ran(app)).toEqual(['m1']);
    expect(await lock(app)).toMatchObject({ locked: false });
  });

  it('rejects when a migration fails, keeps what was applied before it and releases the lock', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const failure = new Error('migration exploded');
    const app = await startApp(uri, [recording('m1'), recording('m2', { fail: failure }), recording('m3')]);

    await expect(new Migrator(app).up()).rejects.toBe(failure);

    expect(await ran(app)).toEqual(['m1']);
    expect(await changelog(app)).toEqual(['m1']);
    expect(await lock(app)).toMatchObject({ locked: false });
  });

  it('continues after the failed migration is fixed', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const broken = await startApp(uri, [recording('m1'), recording('m2', { fail: new Error('nope') }), recording('m3')]);
    await expect(new Migrator(broken).up()).rejects.toThrow('nope');

    const fixed = await startApp(uri, [recording('m1'), recording('m2'), recording('m3')]);
    await new Migrator(fixed).up();

    expect(await ran(fixed)).toEqual(['m1', 'm2', 'm3']);
    expect(await changelog(fixed)).toEqual(['m1', 'm2', 'm3']);
  });

  it('rejects when the changelog doesn\'t match the migrations, and runs nothing', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const original = await startApp(uri, [recording('m1'), recording('m2')]);
    await new Migrator(original).up();

    const reordered = await startApp(uri, [recording('m2'), recording('m1'), recording('m3')]);
    await expect(new Migrator(reordered).up()).rejects.toThrow(/Migration mismatch: \(file\) m2 != \(changelog\) m1/);

    expect(await ran(reordered)).toEqual(['m1', 'm2']);
    expect(await lock(reordered)).toMatchObject({ locked: false });
  });

  it('uses the collection names from the options', async () => {
    const uri = uniqueDatabaseUri('migrator');
    const { app } = await createApp({
      imports: [
        MongooseModule.forRoot(uri),
        MongoMigrateModule.withMigrations([recording('m1')], { collectionName: 'my-changelog', lockCollectionName: 'my-lock' }),
      ],
    });
    apps.push(app);

    await new Migrator(app).up();

    const db = connectionOf(app).db!;
    expect((await db.collection('my-changelog').find().toArray()).map((doc) => doc.identifier)).toEqual(['m1']);
    expect(await db.collection('my-lock').findOne()).toMatchObject({ locked: false });
    expect(await db.collection('changelog').countDocuments()).toBe(0);
  });
});
