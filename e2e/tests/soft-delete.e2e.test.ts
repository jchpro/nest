import { ApiQueryResultResponse } from '@jchpro/nest-common/openapi';
import {
  MongooseCrudModule,
  QueryService,
  type SoftDeletableSchema,
  type SoftDeleteMethods,
  type SoftDeleteModel,
  softDeletePlugin,
} from '@jchpro/nest-mongoose';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { getConnectionToken, InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Connection, type HydratedDocument } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type TestApp } from './helpers/app.js';
import { uniqueDatabaseUri } from './helpers/mongo.js';

@Schema()
class Task implements SoftDeletableSchema {
  @Prop({ required: true })
  title!: string;

  deletedAt?: Date;
}

const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.plugin(softDeletePlugin, { purgeAfterDays: 1 });

type TaskDocument = HydratedDocument<Task> & SoftDeleteMethods;

@Controller('tasks')
class TasksController {
  constructor(
    private readonly queryService: QueryService,
    @InjectModel(Task.name) private readonly taskModel: SoftDeleteModel<TaskDocument>,
  ) {}

  @Get()
  @ApiQueryResultResponse(Task, { map: (task: TaskDocument) => ({ id: task.id, title: task.title, deleted: !!task.deletedAt }) })
  list(@Query('deleted') deleted?: 'only' | 'with') {
    const other = deleted === 'only' ? { onlyDeleted: true } : deleted === 'with' ? { withDeleted: true } : undefined;
    return this.queryService.execute(this.taskModel, { sortBy: 'title', sortOptions: ['title'] }, undefined, undefined, other);
  }

  @Get('count')
  async count(@Query('withDeleted') withDeleted?: string) {
    const result = await this.taskModel.aggregate([{ $count: 'total' }], withDeleted ? { withDeleted: true } : {});
    return { total: result[0]?.total ?? 0 };
  }

  @Post()
  async create(@Body() body: { title: string }) {
    const task = await this.taskModel.create({ title: body.title });
    return { id: task.id };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException();
    }
    return { id: task.id, title: task.title };
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException();
    }
    await task.softDelete();
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    const result = await this.taskModel.restoreOne({ _id: id });
    if (!result.matchedCount) {
      throw new NotFoundException();
    }
  }

  @Delete(':id/purge')
  async purge(@Param('id') id: string) {
    // A soft-deleted document can only be found when asking for it
    const task = await this.taskModel.findOne({ _id: id }, null, { withDeleted: true });
    if (!task) {
      throw new NotFoundException();
    }
    await task.deleteOne();
  }

  @Post('delete-many')
  async deleteMany(@Body() body: { ids: string[]; at: string }) {
    await this.taskModel.softDeleteMany({ _id: { $in: body.ids } }, { deletedAt: new Date(body.at) });
  }

  @Post('restore-many')
  async restoreMany(@Body() body: { ids: string[]; at: string }) {
    const result = await this.taskModel.restoreMany({ _id: { $in: body.ids } }, { deletedAt: new Date(body.at) });
    return { restored: result.modifiedCount };
  }
}

describe('Soft delete plugin', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createApp({
      imports: [
        MongooseModule.forRoot(uniqueDatabaseUri('soft-delete')),
        MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
        MongooseCrudModule.forRoot(),
      ],
      controllers: [TasksController],
    });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  /** A task of its own, so the tests don't depend on each other. */
  async function createTask(title: string): Promise<string> {
    const res = await testApp.http.post('/tasks').send({ title });
    return res.body.id;
  }

  const titles = (body: { title: string }[]) => body.map((task) => task.title);

  it('hides a soft-deleted document from listing, counting and finding by ID', async () => {
    const id = await createTask('hidden-1');
    await createTask('visible-1');

    const deletion = await testApp.http.delete(`/tasks/${id}`);
    const list = await testApp.http.get('/tasks');
    const get = await testApp.http.get(`/tasks/${id}`);

    expect(deletion.status).toBe(200);
    expect(titles(list.body)).not.toContain('hidden-1');
    expect(titles(list.body)).toContain('visible-1');
    expect(get.status).toBe(404);
  });

  it('lists only the soft-deleted documents on request, with the matching total', async () => {
    const id = await createTask('only-deleted-1');
    await testApp.http.delete(`/tasks/${id}`);

    const res = await testApp.http.get('/tasks').query({ deleted: 'only' });

    expect(res.body.every((task: { deleted: boolean }) => task.deleted)).toBe(true);
    expect(titles(res.body)).toContain('only-deleted-1');
    expect(Number(res.headers['x-total-count'])).toBe(res.body.length);
  });

  it('lists the soft-deleted documents together with the live ones on request', async () => {
    await createTask('with-live-1');
    const gone = await createTask('with-gone-1');
    await testApp.http.delete(`/tasks/${gone}`);

    const res = await testApp.http.get('/tasks').query({ deleted: 'with' });
    const plain = await testApp.http.get('/tasks');

    expect(titles(res.body)).toEqual(expect.arrayContaining(['with-live-1', 'with-gone-1']));
    expect(Number(res.headers['x-total-count'])).toBe(Number(plain.headers['x-total-count']) + (await onlyDeletedCount()));
  });

  async function onlyDeletedCount() {
    const res = await testApp.http.get('/tasks').query({ deleted: 'only' });
    return Number(res.headers['x-total-count']);
  }

  it('hides soft-deleted documents from aggregations unless asked to include them', async () => {
    const before = (await testApp.http.get('/tasks/count')).body.total;
    const id = await createTask('aggregated-1');
    await testApp.http.delete(`/tasks/${id}`);

    const live = (await testApp.http.get('/tasks/count')).body.total;
    const all = (await testApp.http.get('/tasks/count').query({ withDeleted: 'true' })).body.total;

    expect(live).toBe(before);
    expect(all).toBeGreaterThan(live);
  });

  it('brings a soft-deleted document back on restore', async () => {
    const id = await createTask('restored-1');
    await testApp.http.delete(`/tasks/${id}`);

    const restore = await testApp.http.post(`/tasks/${id}/restore`);
    const get = await testApp.http.get(`/tasks/${id}`);

    expect(restore.status).toBe(201);
    expect(get.status).toBe(200);
    expect(get.body.title).toBe('restored-1');
  });

  it('can only restore what is soft-deleted', async () => {
    const id = await createTask('never-deleted-1');

    const res = await testApp.http.post(`/tasks/${id}/restore`);

    expect(res.status).toBe(404);
  });

  it('purges a soft-deleted document physically, and it is gone for good', async () => {
    const id = await createTask('purged-1');
    await testApp.http.delete(`/tasks/${id}`);

    const purge = await testApp.http.delete(`/tasks/${id}/purge`);
    const restore = await testApp.http.post(`/tasks/${id}/restore`);
    const withDeleted = await testApp.http.get('/tasks').query({ deleted: 'with' });

    expect(purge.status).toBe(200);
    expect(restore.status).toBe(404);
    expect(titles(withDeleted.body)).not.toContain('purged-1');
  });

  it('restores only the documents which were deleted together, when given the shared timestamp', async () => {
    const [a, b, c] = await Promise.all([createTask('batch-a'), createTask('batch-b'), createTask('batch-c')]);
    const batchAt = '2026-01-01T10:00:00.000Z';
    await testApp.http.post('/tasks/delete-many').send({ ids: [a, b], at: batchAt });
    await testApp.http.post('/tasks/delete-many').send({ ids: [c], at: '2026-01-02T10:00:00.000Z' });

    const restore = await testApp.http.post('/tasks/restore-many').send({ ids: [a, b, c], at: batchAt });
    const list = await testApp.http.get('/tasks');

    expect(restore.body.restored).toBe(2);
    expect(titles(list.body)).toEqual(expect.arrayContaining(['batch-a', 'batch-b']));
    expect(titles(list.body)).not.toContain('batch-c');
  });

  it('expires soft-deleted documents with a TTL index when purgeAfterDays is set', async () => {
    const connection = testApp.app.get<Connection>(getConnectionToken());

    const indexes = await connection.db!.collection('tasks').indexes();

    expect(indexes).toContainEqual(expect.objectContaining({ key: { deletedAt: 1 }, expireAfterSeconds: 24 * 60 * 60 }));
  });
});
