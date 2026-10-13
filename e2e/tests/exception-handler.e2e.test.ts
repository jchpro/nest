import { CommonExceptionHandlerBehaviorHttp, GlobalExceptionHandler } from '@jchpro/nest-common';
import { Body, Controller, Get, NotFoundException, Post, ValidationPipe } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { createApp } from './helpers/app.js';

class CreateDogDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  age!: number;
}

@Controller()
class ThrowingController {
  @Post('dogs')
  createDog(@Body() dto: CreateDogDto) {
    return dto;
  }

  @Get('http-exception')
  httpException() {
    throw new NotFoundException('No such dog');
  }

  @Get('unknown-error')
  unknownError() {
    throw new Error('database exploded');
  }

  @Get('thrown-value')
  thrownValue() {
    throw 'not an error';
  }
}

function appWith(productionMode: boolean) {
  return createApp({ controllers: [ThrowingController] }, (app) => {
    app.useGlobalPipes(new ValidationPipe());
    GlobalExceptionHandler.setup(app, { http: new CommonExceptionHandlerBehaviorHttp(productionMode) });
  });
}

describe('GlobalExceptionHandler', () => {
  it.each([true, false])('responds to an `HttpException` with its status and message (production: %s)', async (productionMode) => {
    const { app, http } = await appWith(productionMode);

    const res = await http.get('/http-exception');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: 'NotFoundException',
      message: 'No such dog',
      path: '/http-exception',
      statusCode: 404,
      timestamp: expect.any(String),
    });
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
    expect(res.body.details).toBeUndefined();
    await app.close();
  });

  it.each([true, false])('tells what was invalid when validation fails (production: %s)', async (productionMode) => {
    const { app, http } = await appWith(productionMode);

    const res = await http.post('/dogs').send({ name: '', age: -1 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'BadRequestException',
      message: 'Bad Request Exception',
      details: expect.arrayContaining(['name should not be empty', 'age must not be less than 0']),
      path: '/dogs',
      statusCode: 400,
      timestamp: expect.any(String),
    });
    expect(res.body.details).toHaveLength(2);
    await app.close();
  });

  it('answers a valid request normally', async () => {
    const { app, http } = await appWith(true);

    const res = await http.post('/dogs').send({ name: 'Rex', age: 3 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ name: 'Rex', age: 3 });
    await app.close();
  });

  it('hides the details of an unknown error and tags it with an UUID in production mode', async () => {
    const { app, http } = await appWith(true);

    const res = await http.get('/unknown-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'InternalServerError',
      path: '/unknown-error',
      statusCode: 500,
      timestamp: expect.any(String),
      uuid: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
    });
    expect(JSON.stringify(res.body)).not.toContain('database exploded');
    await app.close();
  });

  it('shows the details of an unknown error, with the stack trace instead of an UUID, outside of production mode', async () => {
    const { app, http } = await appWith(false);

    const res = await http.get('/unknown-error');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error');
    expect(res.body.message).toBe('database exploded');
    expect(res.body.uuid).toBeUndefined();
    expect(res.body.stack).toContain('database exploded');
    await app.close();
  });

  it('answers with 500 also when something other than an error was thrown, without revealing it in production mode', async () => {
    const { app, http } = await appWith(true);

    const res = await http.get('/thrown-value');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('InternalServerError');
    expect(JSON.stringify(res.body)).not.toContain('not an error');
    await app.close();
  });

  it('hides the details of an unknown error with the default behavior too', async () => {
    const { app, http } = await createApp({ controllers: [ThrowingController] }, (nestApp) => {
      GlobalExceptionHandler.setup(nestApp, { http: true });
    });

    const res = await http.get('/unknown-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'InternalServerError',
      path: '/unknown-error',
      statusCode: 500,
      timestamp: expect.any(String),
      uuid: expect.any(String),
    });
    await app.close();
  });
});
