import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import {
  AUTH_CONFIG,
  MAILER,
  PASSWORD_HASHER,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  STAFF_USER_REPOSITORY,
  type AuthConfig,
} from '../src/modules/auth/auth.tokens.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createAuthDeps, staffUser, STRONG_PASSWORD } from './support/in-memory-auth.js';

describe('auth HTTP flow (e2e)', () => {
  let app: INestApplication<Server>;
  const deps = createAuthDeps();
  const config: AuthConfig = { ...deps.config, secureCookies: false };

  beforeAll(async () => {
    deps.users.add(staffUser());
    // Real token generator, TOTP and clock; persistence and hashing use in-memory fakes, so no database.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AUTH_CONFIG)
      .useValue(config)
      .overrideProvider(STAFF_USER_REPOSITORY)
      .useValue(deps.users)
      .overrideProvider(SESSION_REPOSITORY)
      .useValue(deps.sessions)
      .overrideProvider(PASSWORD_RESET_TOKEN_REPOSITORY)
      .useValue(deps.resetTokens)
      .overrideProvider(PASSWORD_HASHER)
      .useValue(deps.hasher)
      .overrideProvider(MAILER)
      .useValue(deps.mailer)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app, []);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in with an httpOnly cookie, reads /me, and logs out', async () => {
    const agent = request.agent(app.getHttpServer());

    const login = await agent
      .post('/auth/login')
      .send({ email: 'turno@cafecentral.com', password: STRONG_PASSWORD, remember: true })
      .expect(200);
    const staff = { id: 'staff-1', email: 'turno@cafecentral.com', name: 'Sofía M.', role: 'OWNER' };
    expect(login.body).toEqual({ status: 'authenticated', staff });
    const cookie = String(login.headers['set-cookie']);
    expect(cookie).toMatch(/^cp_session=[\w-]{43};/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Max-Age=43200/);

    await agent.get('/auth/me').expect(200, { staff });

    await agent.post('/auth/logout').expect(204);
    await agent.get('/auth/me').expect(401);
  });

  it('rejects bad credentials with a generic 401 and invalid bodies with 400', async () => {
    const server = app.getHttpServer();
    const response = await request(server)
      .post('/auth/login')
      .send({ email: 'ghost@cafecentral.com', password: 'whatever' })
      .expect(401);
    expect(response.body).toMatchObject({ error: 'invalid_credentials' });

    await request(server).post('/auth/login').send({ email: 'not-an-email' }).expect(400);
  });

  it('answers forgot-password with 202 for any address', async () => {
    await request(app.getHttpServer()).post('/auth/password/forgot').send({ email: 'ghost@cafecentral.com' }).expect(202);
  });
});
