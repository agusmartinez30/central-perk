import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_CONFIG } from '../src/modules/auth/auth.tokens.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';

describe('GET /health (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    // The health check is DB-free, so PrismaService is replaced and no database is needed.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AUTH_CONFIG)
      .useValue({})
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns status ok', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});
