import { ApiQueryResultResponse, PaginationParams, SortingType } from '@jchpro/nest-common/openapi';
import { type FilterQueryProvider, MongooseCrudModule, QueryService } from '@jchpro/nest-mongoose';
import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { type FilterQuery, type HydratedDocument, type Model } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type TestApp } from './helpers/app.js';
import { uniqueDatabaseUri } from './helpers/mongo.js';

@Schema()
class Dog {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  age!: number;

  @Prop({ required: true })
  breed!: string;
}

const DogSchema = SchemaFactory.createForClass(Dog);

type DogDocument = HydratedDocument<Dog>;

class DogsQuery
  extends IntersectionType(PaginationParams, SortingType<Dog>(['name', 'age']))
  implements FilterQueryProvider<Dog>
{
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  breed?: string;

  getFilters(): FilterQuery<Dog> {
    return this.breed ? { breed: this.breed } : {};
  }
}

@Controller('dogs')
class DogsController {
  constructor(
    private readonly queryService: QueryService,
    @InjectModel(Dog.name) private readonly dogModel: Model<DogDocument>,
  ) {}

  @Get()
  @ApiQueryResultResponse(Dog, { map: (dog) => ({ name: dog.name, age: dog.age, breed: dog.breed }) })
  list(@Query() query: DogsQuery) {
    return this.queryService.execute<DogDocument>(this.dogModel, query, query);
  }
}

const dogs = [
  { name: 'Ace', age: 3, breed: 'collie' },
  { name: 'Bella', age: 9, breed: 'beagle' },
  { name: 'Charlie', age: 5, breed: 'collie' },
  { name: 'Daisy', age: 1, breed: 'poodle' },
  { name: 'Eddie', age: 7, breed: 'beagle' },
  { name: 'Finn', age: 2, breed: 'collie' },
  { name: 'Goose', age: 4, breed: 'poodle' },
];

describe('QueryService with the pagination and sorting DTOs', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createApp(
      {
        imports: [
          MongooseModule.forRoot(uniqueDatabaseUri('query')),
          MongooseModule.forFeature([{ name: Dog.name, schema: DogSchema }]),
          MongooseCrudModule.forRoot({ maxLimit: 5 }),
        ],
        controllers: [DogsController],
      },
      (app) => {
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, transformOptions: { enableImplicitConversion: true } }));
      },
    );
    await testApp.app.get<Model<Dog>>(`${Dog.name}Model`).insertMany(dogs);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  const names = (body: { name: string }[]) => body.map((dog) => dog.name);

  it('lists the page which was asked for, with the total in the header', async () => {
    const res = await testApp.http.get('/dogs').query({ sortBy: 'name', limit: 5 });

    expect(res.status).toBe(200);
    expect(names(res.body)).toEqual(['Ace', 'Bella', 'Charlie', 'Daisy', 'Eddie']);
    expect(res.headers['x-total-count']).toBe('7');
  });

  // Expected failure until https://github.com/jchpro/nest/issues/48 is decided: the maximum limit is not applied without a requested limit
  it.fails('applies the maximum limit when no limit is requested', async () => {
    const res = await testApp.http.get('/dogs').query({ sortBy: 'name' });

    expect(res.body).toHaveLength(5);
    expect(res.headers['x-total-count']).toBe('7');
  });

  it('caps the requested limit with the maximum limit of the module', async () => {
    const res = await testApp.http.get('/dogs').query({ sortBy: 'name', limit: 100 });

    expect(res.body).toHaveLength(5);
    expect(res.headers['x-total-count']).toBe('7');
  });

  it('honors a limit below the maximum', async () => {
    const res = await testApp.http.get('/dogs').query({ sortBy: 'name', limit: 2 });

    expect(names(res.body)).toEqual(['Ace', 'Bella']);
  });

  it('skips the offset', async () => {
    const res = await testApp.http.get('/dogs').query({ sortBy: 'name', limit: 3, offset: 4 });

    expect(names(res.body)).toEqual(['Eddie', 'Finn', 'Goose']);
    expect(res.headers['x-total-count']).toBe('7');
  });

  it('sorts ascending by default and descending on request', async () => {
    const asc = await testApp.http.get('/dogs').query({ sortBy: 'age', limit: 3 });
    const desc = await testApp.http.get('/dogs').query({ sortBy: 'age', sortDesc: 'true', limit: 3 });

    expect(asc.body.map((dog: { age: number }) => dog.age)).toEqual([1, 2, 3]);
    expect(desc.body.map((dog: { age: number }) => dog.age)).toEqual([9, 7, 5]);
  });

  it('filters, and counts only what matches the filter', async () => {
    const res = await testApp.http.get('/dogs').query({ breed: 'collie', sortBy: 'name' });

    expect(names(res.body)).toEqual(['Ace', 'Charlie', 'Finn']);
    expect(res.headers['x-total-count']).toBe('3');
  });

  it('combines the filter with the pagination', async () => {
    const res = await testApp.http.get('/dogs').query({ breed: 'beagle', sortBy: 'age', sortDesc: 'true', limit: 1, offset: 1 });

    expect(names(res.body)).toEqual(['Eddie']);
    expect(res.headers['x-total-count']).toBe('2');
  });

  it('answers with an empty list for a filter nothing matches', async () => {
    const res = await testApp.http.get('/dogs').query({ breed: 'dachshund' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(res.headers['x-total-count']).toBe('0');
  });

  it.each([
    ['a field which is not a sorting option', { sortBy: 'breed' }],
    ['a zero limit', { limit: 0 }],
    ['a negative offset', { offset: -1 }],
  ])('rejects %s', async (_name, query) => {
    const res = await testApp.http.get('/dogs').query(query);

    expect(res.status).toBe(400);
  });
});
