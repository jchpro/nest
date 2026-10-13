import {
  type SoftDeleteMethods,
  type SoftDeleteModel,
  ReferencingDocsLookupService,
  SchemaReferencesService,
  SingleConnectionSchemaRefsModule,
  type SingleConnectionSchemaRefsOptions,
  softDeletePlugin,
} from '@jchpro/nest-mongoose';
import { Body, Controller, Delete, HttpException, Param, Post } from '@nestjs/common';
import { InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument, type Model } from 'mongoose';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, type TestApp } from './helpers/app.js';
import { uniqueDatabaseUri } from './helpers/mongo.js';

@Schema()
class Owner {
  @Prop({ required: true })
  name!: string;
}

@Schema()
class Vet {
  @Prop({ required: true })
  name!: string;
}

// A reference inside an array of sub documents, to see that nested references are found too
@Schema({ _id: false })
class Visit {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Vet.name, required: true })
  vet!: mongoose.Types.ObjectId;
}

@Schema()
class Cat {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Owner.name })
  owner?: mongoose.Types.ObjectId;

  @Prop({ type: [SchemaFactory.createForClass(Visit)], default: [] })
  visits!: Visit[];

  deletedAt?: Date;
}

const OwnerSchema = SchemaFactory.createForClass(Owner);
const VetSchema = SchemaFactory.createForClass(Vet);
const CatSchema = SchemaFactory.createForClass(Cat);
CatSchema.plugin(softDeletePlugin);

type CatDocument = HydratedDocument<Cat> & SoftDeleteMethods;

@Controller()
class TestController {
  constructor(
    private readonly refs: SchemaReferencesService,
    private readonly lookup: ReferencingDocsLookupService,
    @InjectModel(Owner.name) private readonly ownerModel: Model<Owner>,
    @InjectModel(Vet.name) private readonly vetModel: Model<Vet>,
    @InjectModel(Cat.name) private readonly catModel: SoftDeleteModel<CatDocument>,
  ) {}

  @Post('owners')
  async createOwner(@Body() body: { name: string }) {
    return { id: (await this.ownerModel.create(body)).id };
  }

  @Post('vets')
  async createVet(@Body() body: { name: string }) {
    return { id: (await this.vetModel.create(body)).id };
  }

  @Post('cats')
  async createCat(@Body() body: { name: string; owner?: string; vets?: string[] }) {
    const visits = (body.vets ?? []).map((vet) => ({ vet }));
    return { id: (await this.catModel.create({ name: body.name, owner: body.owner, visits })).id };
  }

  @Delete('owners/:id')
  async deleteOwner(@Param('id') id: string) {
    await this.lookup.assertUnreferenced(new mongoose.Types.ObjectId(id), this.refs.getSchemasReferencing(Owner.name));
    await this.ownerModel.deleteOne({ _id: id });
  }

  @Delete('vets/:id')
  async deleteVet(@Param('id') id: string) {
    await this.lookup.assertUnreferenced(new mongoose.Types.ObjectId(id), this.refs.getSchemasReferencing(Vet.name));
    await this.vetModel.deleteOne({ _id: id });
  }

  @Delete('cats/:id')
  async softDeleteCat(@Param('id') id: string) {
    await this.catModel.softDeleteOne({ _id: id });
  }

  @Delete('cats/:id/purge')
  async purgeCat(@Param('id') id: string) {
    await this.catModel.deleteOne({ _id: id }, { withDeleted: true });
  }
}

describe('SingleConnectionSchemaRefsModule', () => {
  let testApp: TestApp | undefined;

  afterEach(async () => {
    await testApp?.app.close();
  });

  async function startApp(options?: SingleConnectionSchemaRefsOptions) {
    testApp = await createApp({
      imports: [
        MongooseModule.forRoot(uniqueDatabaseUri('schema-refs')),
        MongooseModule.forFeature([
          { name: Owner.name, schema: OwnerSchema },
          { name: Vet.name, schema: VetSchema },
          { name: Cat.name, schema: CatSchema },
        ]),
        SingleConnectionSchemaRefsModule.forRoot(options),
      ],
      controllers: [TestController],
    });
    return testApp;
  }

  const idOf = async (app: TestApp, path: string, body: object) => (await app.http.post(path).send(body)).body.id as string;

  it('knows which schemas reference a model, nested references included', async () => {
    const { app } = await startApp();
    const refs = app.get(SchemaReferencesService);

    expect(refs.getSchemasReferencing(Owner.name)).toEqual([expect.objectContaining({ schema: 'Cat', path: 'owner' })]);
    expect(refs.getSchemasReferencing(Vet.name)).toEqual([expect.objectContaining({ schema: 'Cat', path: 'visits.vet' })]);
    expect(refs.getSchemasReferencing(Cat.name)).toEqual([]);
  });

  it('refuses to delete a document which is referenced, naming the referencing documents', async () => {
    const app = await startApp();
    const owner = await idOf(app, '/owners', { name: 'Ann' });
    const cat = await idOf(app, '/cats', { name: 'Tom', owner });

    const res = await app.http.delete(`/owners/${owner}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain(owner);
    expect(res.body.message).toContain('Cat');
    expect(res.body.message).toContain(cat);
  });

  it('finds references inside arrays of sub documents', async () => {
    const app = await startApp();
    const vet = await idOf(app, '/vets', { name: 'Dr. Vet' });
    await idOf(app, '/cats', { name: 'Tom', vets: [vet] });

    const res = await app.http.delete(`/vets/${vet}`);

    expect(res.status).toBe(409);
  });

  it('deletes a document which nothing references', async () => {
    const app = await startApp();
    const owner = await idOf(app, '/owners', { name: 'Free' });
    await idOf(app, '/cats', { name: 'Stray' });

    const res = await app.http.delete(`/owners/${owner}`);

    expect(res.status).toBe(200);
  });

  it('counts a soft-deleted referencing document, so restoring it can never leave a dangling reference', async () => {
    const app = await startApp();
    const owner = await idOf(app, '/owners', { name: 'Bob' });
    const cat = await idOf(app, '/cats', { name: 'Ghost', owner });
    await app.http.delete(`/cats/${cat}`);

    const res = await app.http.delete(`/owners/${owner}`);

    expect(res.status).toBe(409);
  });

  it('allows the deletion once the referencing document is gone for good', async () => {
    const app = await startApp();
    const owner = await idOf(app, '/owners', { name: 'Carl' });
    const cat = await idOf(app, '/cats', { name: 'Gone', owner });
    await app.http.delete(`/cats/${cat}`);
    await app.http.delete(`/cats/${cat}/purge`);

    const res = await app.http.delete(`/owners/${owner}`);

    expect(res.status).toBe(200);
  });

  it('throws the error made by the factory from the options', async () => {
    const app = await startApp({
      unrefAssertionErrorFactory: (id, infos) =>
        new HttpException({ code: 'STILL_REFERENCED', id, by: infos.map((info) => `${info.name}:${info.count}`) }, 422),
    });
    const owner = await idOf(app, '/owners', { name: 'Dana' });
    await idOf(app, '/cats', { name: 'One', owner });
    await idOf(app, '/cats', { name: 'Two', owner });

    const res = await app.http.delete(`/owners/${owner}`);

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ code: 'STILL_REFERENCED', id: owner, by: ['Cat:2'] });
  });

  it('leaves out the models listed in skipModels', async () => {
    const app = await startApp({ skipModels: [Cat.name] });
    const owner = await idOf(app, '/owners', { name: 'Eve' });
    await idOf(app, '/cats', { name: 'Unseen', owner });

    const res = await app.http.delete(`/owners/${owner}`);

    expect(res.status).toBe(200);
  });
});
