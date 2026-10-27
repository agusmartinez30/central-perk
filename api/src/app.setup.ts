import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** HTTP middleware shared by `main.ts` and the e2e tests. */
export function configureApp(app: INestApplication, corsOrigins: string[]): void {
  app.use(cookieParser());
  // Credentials are needed so browsers send the `cp_session` cookie cross-origin.
  app.enableCors({ origin: corsOrigins, credentials: true });
}
