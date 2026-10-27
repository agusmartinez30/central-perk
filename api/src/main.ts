import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { loadEnv } from './shared/config/env.js';

// Validate configuration before Nest boots so misconfiguration fails fast and readably.
const env = loadEnv();

const app = await NestFactory.create(AppModule);
configureApp(app, env.CORS_ORIGINS);
app.enableShutdownHooks();
await app.listen(env.PORT);
