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
} from '../src/modules/auth/auth.tokens.js';
import { PAYMENT_SETTINGS_REPOSITORY, VENUE_PROFILE_REPOSITORY } from '../src/modules/venue/venue.tokens.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createAuthDeps, staffUser, STRONG_PASSWORD } from './support/in-memory-auth.js';
import { createVenueDeps, savedPaymentSettings, venueProfile } from './support/in-memory-venue.js';

describe('venue HTTP (e2e)', () => {
  let app: INestApplication<Server>;
  const auth = createAuthDeps();
  const venue = createVenueDeps();

  beforeAll(async () => {
    auth.users.add(staffUser({ role: 'STAFF' }));
    venue.profiles.current = venueProfile();
    venue.paymentSettings.current = savedPaymentSettings();
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
      .overrideProvider(VENUE_PROFILE_REPOSITORY)
      .useValue(venue.profiles)
      .overrideProvider(PAYMENT_SETTINGS_REPOSITORY)
      .useValue(venue.paymentSettings)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app, []);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the public profile and payment options without a session', async () => {
    const server = app.getHttpServer();

    const profile = await request(server).get('/venue').expect(200);
    expect(profile.body).toMatchObject({
      name: 'Café Central',
      timezone: 'America/Argentina/Cordoba',
      // Real clock: open or closed depends on when the test runs.
      openStatus: expect.objectContaining({ open: expect.any(Boolean) as unknown }) as unknown,
    });

    await request(server).get('/venue/payment-options').expect(200, { requestModes: ['table', 'register', 'transfer'] });
  });

  it('requires a session for admin endpoints', async () => {
    const server = app.getHttpServer();
    await request(server).put('/venue').send(venueProfile()).expect(401);
    await request(server).get('/venue/payment-settings').expect(401);
    await request(server).put('/venue/payment-settings').send(savedPaymentSettings().settings).expect(401);
  });

  it('lets signed-in staff edit the profile and payment settings', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login').send({ email: 'turno@cafecentral.com', password: STRONG_PASSWORD }).expect(200);

    const profile = await agent.put('/venue').send(venueProfile({ name: 'Café Central Centro' })).expect(200);
    expect(profile.body).toMatchObject({ name: 'Café Central Centro' });

    await agent.get('/venue/payment-settings').expect(200);
    const { settings } = savedPaymentSettings();
    const saved = await agent
      .put('/venue/payment-settings')
      .send({ ...settings, requestModes: { ...settings.requestModes, register: false } })
      .expect(200);
    expect(saved.body).toMatchObject({
      version: 2,
      updatedAt: expect.any(String) as unknown,
      settings: { requestModes: { register: false } },
    });

    await agent.get('/venue/payment-options').expect(200, { requestModes: ['table', 'transfer'] });
  });

  it('answers rule violations with 400 and field codes', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login').send({ email: 'turno@cafecentral.com', password: STRONG_PASSWORD }).expect(200);
    const { settings } = savedPaymentSettings();

    const response = await agent
      .put('/venue/payment-settings')
      .send({ ...settings, bankAccount: { ...settings.bankAccount, alias: 'X' } })
      .expect(400);
    expect(response.body).toMatchObject({ error: 'invalid_payment_settings', issues: ['invalid_bank_account'], bankAccount: { alias: 'invalid_format' } });

    await agent.put('/venue/payment-settings').send({ methods: {} }).expect(400);
  });
});
