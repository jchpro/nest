import { QueryResult } from '@jchpro/nest-common';
import { ApiQueryResultResponse, SwaggerUiFactory } from '@jchpro/nest-common/openapi';
import { Controller, Get } from '@nestjs/common';
import { ApiProperty, DocumentBuilder } from '@nestjs/swagger';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type TestApp } from './helpers/app.js';

class DogDto {
  @ApiProperty()
  name!: string;
}

@Controller('dogs')
class DogsController {
  @Get()
  @ApiQueryResultResponse(DogDto, { map: (dog: { name: string }) => ({ name: dog.name.toUpperCase() }) })
  list() {
    return new QueryResult([{ name: 'rex' }, { name: 'ace' }], 42, 0, 2);
  }

  @Get('plain')
  @ApiQueryResultResponse(DogDto)
  plain() {
    return new QueryResult([{ name: 'rex' }], 1);
  }
}

describe('OpenAPI utilities', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createApp({ controllers: [DogsController] }, (app) => {
      // As in `main.ts`
      SwaggerUiFactory.create(app, new DocumentBuilder().setTitle('Dogs').setVersion('1.0').build()).serve('docs', {
        serveDoc: true,
      });
    });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('@ApiQueryResultResponse', () => {
    it('responds with the items and puts the total in X-Total-Count', async () => {
      const res = await testApp.http.get('/dogs/plain');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ name: 'rex' }]);
      expect(res.headers['x-total-count']).toBe('1');
    });

    it('maps the items when asked to', async () => {
      const res = await testApp.http.get('/dogs');

      expect(res.body).toEqual([{ name: 'REX' }, { name: 'ACE' }]);
      expect(res.headers['x-total-count']).toBe('42');
    });
  });

  describe('Swagger UI', () => {
    it('serves the UI', async () => {
      const res = await testApp.http.get('/docs');

      expect(res.status).toBe(200);
      expect(res.text.toLowerCase()).toContain('swagger');
    });

    it('serves the OpenAPI document as JSON', async () => {
      const res = await testApp.http.get('/docs/doc.json');

      expect(res.status).toBe(200);
      expect(res.body.info.title).toBe('Dogs');
      expect(Object.keys(res.body.paths)).toEqual(['/dogs', '/dogs/plain']);
    });

    it('documents the list as an array of the DTO with the total count header', async () => {
      const res = await testApp.http.get('/docs/doc.json');

      const ok = res.body.paths['/dogs'].get.responses['200'];
      expect(ok.content['application/json'].schema).toEqual({
        type: 'array',
        items: { $ref: '#/components/schemas/DogDto' },
      });
      expect(ok.headers['X-Total-Count']).toBeDefined();
      expect(res.body.components.schemas.DogDto.properties.name).toEqual({ type: 'string' });
    });
  });
});
