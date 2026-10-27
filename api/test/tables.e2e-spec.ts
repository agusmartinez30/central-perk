import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import {
  AUTH_CONFIG,
  MAILER,
  PASSWORD_HASHER,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  STAFF_USER_REPOSITORY,
} from '../src/modules/auth/auth.tokens.js';
import { QR_TOKEN_GENERATOR, TABLE_ACTIVITY, TABLES_REPOSITORY } from '../src/modules/tables/tables.tokens.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createAuthDeps, staffUser, STRONG_PASSWORD } from './support/in-memory-auth.js';
import { createTablesDeps, tablesConfiguration } from './support/in-memory-tables.js';

/** Just enough of the `{ spaces, tables }` response for the assertions. */
type ConfigurationJson = { spaces: { id: string }[]; tables: { layout: { shape: string } }[] };
const config = (response: { body: unknown }) => response.body as ConfigurationJson;

describe('tables HTTP (e2e)', () => {
  let app: INestApplication<Server>;
  /** Signed in once: login is rate limited. */
  let agent: ReturnType<typeof request.agent>;
  const auth = createAuthDeps();
  const tables = createTablesDeps();

  beforeAll(async () => {
    auth.users.add(staffUser({ role: 'STAFF' }));
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AUTH_CONFIG)
      .useValue({ ...auth.config, secureCookies: false })
      .overrideProvider(STAFF_USER_REPOSITORY)
      .useValue(auth.users)
      .overrideProvider(SESSION_REPOSITORY)
      .useValue(auth.sessions)
      .overrideProvider(PASSWORD_RESET_TOKEN_REPOSITORY)
      .useValue(auth.resetTokens)
      .overrideProvider(PASSWORD_HASHER)
      .useValue(auth.hasher)
      .overrideProvider(MAILER)
      .useValue(auth.mailer)
      .overrideProvider(TABLES_REPOSITORY)
      .useValue(tables.tables)
      .overrideProvider(TABLE_ACTIVITY)
      .useValue(tables.activity)
      .overrideProvider(QR_TOKEN_GENERATOR)
      .useValue(tables.tokens)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app, []);
    await app.init();
    agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login').send({ email: 'turno@cafecentral.com', password: STRONG_PASSWORD }).expect(200);
  });

  beforeEach(() => {
    tables.tables.reset(tablesConfiguration());
    tables.activity.byTable.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('resolves a QR publicly only for an enabled table with its active token', async () => {
    const server = app.getHttpServer();
    await request(server)
      .get('/tables/qr')
      .query({ number: '02', token: 'Tok02abcde' })
      .expect(200, { number: 2, label: 'Mesa 02', spaceName: 'Salón' });

    const rotated = await request(server).get('/tables/qr').query({ number: '02', token: 'Old02abcde' }).expect(404);
    expect(rotated.body).toEqual({ statusCode: 404, error: 'table_not_found', message: 'Table not found' });
    await request(server).get('/tables/qr').query({ number: '01', token: 'Tok02abcde' }).expect(404);
    await request(server).get('/tables/qr').query({ number: 'x', token: 'Tok02abcde' }).expect(400);
  });

  it('requires a session for the admin endpoints', async () => {
    const server = app.getHttpServer();
    await request(server).get('/tables/config').expect(401);
    await request(server).post('/tables/spaces').send({ name: 'Barra' }).expect(401);
    await request(server).post('/tables/tbl_01/disable').expect(401);
    await request(server).post('/tables/tbl_01/qr/regenerate').expect(401);
  });

  it('serves the configuration with ISO dates and the issuer', async () => {
    const response = await agent.get('/tables/config').expect(200);
    expect(response.body).toMatchObject({
      spaces: [{ id: 'salon', name: 'Salón', icon: 'store', tone: 'brand' }, { id: 'terraza' }],
      tables: [
        { id: 'tbl_01', number: 1, layout: { x: 38, y: 64, width: 150, height: 132, shape: 'rect' } },
        {
          id: 'tbl_02',
          version: 18,
          qr: { token: 'Tok02abcde', issuedAt: '2026-10-21T12:00:00.000Z', issuedBy: { id: 'staff-1', name: 'Sofía M.' } },
          revokedQrs: [{ token: 'Old02abcde', revokedAt: '2026-10-21T12:00:00.000Z', auditNumber: 118 }],
        },
        { id: 'tbl_03' },
      ],
    });
  });

  it('manages spaces', async () => {
    const created = await agent.post('/tables/spaces').send({ name: 'Barra alta', icon: 'sun' }).expect(201);
    expect(config(created).spaces.at(-1)).toEqual({ id: 'barra-alta', name: 'Barra alta', icon: 'sun', tone: 'neutral' });

    await agent.patch('/tables/spaces/barra-alta').send({ name: 'Barra', tone: 'success' }).expect(200);
    const moved = await agent.post('/tables/spaces/barra-alta/move').send({ direction: 'up' }).expect(200);
    expect(config(moved).spaces.map((space) => space.id)).toEqual(['salon', 'barra-alta', 'terraza']);
    const removed = await agent.delete('/tables/spaces/barra-alta').expect(200);
    expect(config(removed).spaces).toHaveLength(2);

    const duplicate = await agent.post('/tables/spaces').send({ name: 'SALON' }).expect(400);
    expect(duplicate.body).toMatchObject({ error: 'invalid_space', issues: [{ path: 'name', code: 'duplicate' }] });
    const busy = await agent.delete('/tables/spaces/salon').expect(409);
    expect(busy.body).toMatchObject({ error: 'space_not_removable', reason: 'space_has_tables', tableCount: 2 });
    await agent.patch('/tables/spaces/nope').send({ name: 'X' }).expect(404, { statusCode: 404, error: 'space_not_found', message: 'Space not found' });
    await agent.post('/tables/spaces/salon/move').send({ direction: 'left' }).expect(400);
  });

  it('creates, edits, toggles and deletes tables', async () => {
    const draft = { label: 'Mesa 04', spaceId: 'terraza', capacity: 6, description: 'Barra', enabled: true };

    const created = await agent.post('/tables').send({ ...draft, shape: 'round' }).expect(201);
    expect(config(created).tables.at(-1)).toMatchObject({
      id: 'tbl_04',
      number: 4,
      version: 1,
      layout: { x: 222, y: 64, shape: 'round' },
      qr: { token: 'TOKEN00001', issuedBy: { id: 'staff-1', name: 'Sofía M.' } },
    });

    const edited = await agent.patch('/tables/tbl_04').send({ ...draft, label: 'Mesa larga' }).expect(200);
    expect(config(edited).tables.at(-1)).toMatchObject({ label: 'Mesa larga', version: 2 });

    const disabled = await agent.post('/tables/tbl_04/disable').expect(200);
    expect(config(disabled).tables.at(-1)).toMatchObject({ enabled: false, version: 3 });
    await agent.post('/tables/tbl_04/enable').expect(200);

    const invalid = await agent.post('/tables').send({ ...draft, label: 'mesa 01', capacity: 21 }).expect(400);
    expect(invalid.body).toMatchObject({
      error: 'invalid_table',
      issues: [
        { path: 'label', code: 'duplicate' },
        { path: 'capacity', code: 'out_of_range' },
      ],
    });
    await agent.post('/tables').send({ ...draft, capacity: '6' }).expect(400);

    const removed = await agent.delete('/tables/tbl_04').expect(200);
    expect(config(removed).tables).toHaveLength(3);
    await agent.delete('/tables/tbl_04').expect(404);
  });

  it('refuses to disable or delete a table with session activity', async () => {
    tables.activity.byTable.set('tbl_01', { openSession: true, hadSession: true });
    tables.activity.byTable.set('tbl_02', { openSession: false, hadSession: true });

    await agent.post('/tables/tbl_01/disable').expect(409).expect((response) => {
      expect(response.body).toMatchObject({ error: 'table_has_open_session' });
    });
    await agent.delete('/tables/tbl_01').expect(409);
    const history = await agent.delete('/tables/tbl_02').expect(409);
    expect(history.body).toMatchObject({ error: 'table_has_history' });
    await agent.post('/tables/tbl_02/disable').expect(200);
  });

  it('edits the floor plan', async () => {
    const moved = await agent.put('/tables/tbl_01/position').send({ x: -13, y: 5 }).expect(200);
    expect(config(moved).tables[0]).toMatchObject({ layout: { x: 0, y: 8 }, version: 2 });

    const resized = await agent.put('/tables/tbl_01/size').send({ x: 0, y: 8, width: 10, height: 10 }).expect(200);
    expect(config(resized).tables[0]?.layout).toMatchObject({ width: 96, height: 88 });

    const shaped = await agent.put('/tables/tbl_01/shape').send({ shape: 'round' }).expect(200);
    expect(config(shaped).tables[0]?.layout.shape).toBe('round');

    const overlap = await agent.put('/tables/tbl_01/position').send({ x: 222, y: 64 }).expect(409);
    expect(overlap.body).toMatchObject({ error: 'table_overlap', conflict: { id: 'tbl_02', number: 2, label: 'Mesa 02' } });
    await agent.put('/tables/tbl_01/size').send({ x: 0, y: 0, width: 10.5, height: 10 }).expect(400);
  });

  it('regenerates a QR: the old code stops resolving', async () => {
    const regenerated = await agent.post('/tables/tbl_01/qr/regenerate').expect(200);
    expect(config(regenerated).tables[0]).toMatchObject({
      version: 2,
      qr: { token: 'TOKEN00002', issuedBy: { id: 'staff-1' } },
      revokedQrs: [{ token: 'Tok01abcde', auditNumber: 119 }],
    });

    await request(app.getHttpServer()).get('/tables/qr').query({ number: '1', token: 'Tok01abcde' }).expect(404);
    await request(app.getHttpServer()).get('/tables/qr').query({ number: '1', token: 'TOKEN00002' }).expect(200);
  });
});
