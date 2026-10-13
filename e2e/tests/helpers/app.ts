import { type INestApplication, type ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';

export interface TestApp {
  readonly app: INestApplication;
  readonly http: ReturnType<typeof supertest>;
}

/**
 * Boots a throwaway Nest app from the given module metadata. `setup` runs before `init`,
 * where `main.ts` of a real app would do its bootstrapping (exception handler, global prefix, ...).
 */
export async function createApp(
  metadata: ModuleMetadata,
  setup?: (app: INestApplication) => void | Promise<void>,
): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule(metadata).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await setup?.(app);
  await app.init();
  return { app, http: supertest(app.getHttpServer()) };
}
