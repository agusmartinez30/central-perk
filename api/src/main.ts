import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnv } from './shared/config/env.js';

// Validate configuration before Nest boots so misconfiguration fails fast and readably.
const env = loadEnv();

const app = await NestFactory.create(AppModule);
app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
app.enableShutdownHooks();
await app.listen(env.PORT);
