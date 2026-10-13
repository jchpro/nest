import { CommonExceptionHandlerBehaviorHttp, GlobalExceptionHandler } from '@jchpro/nest-common';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createApp } from './helpers/app.js';

@Controller()
class ThrowingController {
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
