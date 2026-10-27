import { Module, type Provider } from '@nestjs/common';
import { loadEnv } from '../../shared/config/env.js';
import type { AuthDeps } from './application/auth-deps.js';
import { AuthenticateSession } from './application/authenticate-session.js';
import { Login } from './application/login.js';
import { Logout } from './application/logout.js';
import type { Mailer, PasswordHasher } from './application/ports.js';
import { RequestPasswordReset } from './application/request-password-reset.js';
import { ResetPassword } from './application/reset-password.js';
import { VerifyMfa } from './application/verify-mfa.js';
import {
  AUTH_CONFIG,
  AUTH_DEPS,
  MAILER,
  PASSWORD_HASHER,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  STAFF_USER_REPOSITORY,
  type AuthConfig,
} from './auth.tokens.js';
import type { PasswordResetTokenRepository } from './domain/password-reset-token.js';
import type { SessionRepository } from './domain/session.js';
import type { StaffUserRepository } from './domain/staff-user.js';
import { AuthController } from './http/auth.controller.js';
import { SessionGuard } from './http/session.guard.js';
import {
  PrismaPasswordResetTokenRepository,
  PrismaSessionRepository,
  PrismaStaffUserRepository,
} from './infrastructure/prisma-auth.repositories.js';
import { Rfc6238Totp } from './infrastructure/rfc6238-totp.js';
import { Argon2PasswordHasher, ConsoleMailer, CryptoTokenGenerator, SystemClock } from './infrastructure/security-adapters.js';

const MINUTE_MS = 60_000;

function authConfigFromEnv(): AuthConfig {
  const env = loadEnv();
  return {
    sessionTtlMs: env.SESSION_TTL_HOURS * 60 * MINUTE_MS,
    mfaPendingTtlMs: 10 * MINUTE_MS,
    // The admin reset screen (11C) counts down from 15 minutes.
    resetTokenTtlMs: 15 * MINUTE_MS,
    resetPasswordUrl: new URL('/reset-password', env.ADMIN_URL).toString(),
    secureCookies: env.NODE_ENV === 'production',
  };
}

const useCaseProviders: Provider[] = [Login, VerifyMfa, AuthenticateSession, Logout, RequestPasswordReset, ResetPassword].map(
  (UseCase: new (deps: AuthDeps) => unknown) => ({
    provide: UseCase,
    useFactory: (deps: AuthDeps) => new UseCase(deps),
    inject: [AUTH_DEPS],
  }),
);

@Module({
  controllers: [AuthController],
  providers: [
    { provide: AUTH_CONFIG, useFactory: authConfigFromEnv },
    { provide: STAFF_USER_REPOSITORY, useClass: PrismaStaffUserRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useClass: PrismaPasswordResetTokenRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: MAILER, useClass: ConsoleMailer },
    {
      provide: AUTH_DEPS,
      inject: [STAFF_USER_REPOSITORY, SESSION_REPOSITORY, PASSWORD_RESET_TOKEN_REPOSITORY, PASSWORD_HASHER, MAILER, AUTH_CONFIG],
      useFactory: (
        users: StaffUserRepository,
        sessions: SessionRepository,
        resetTokens: PasswordResetTokenRepository,
        hasher: PasswordHasher,
        mailer: Mailer,
        config: AuthConfig,
      ): AuthDeps => ({
        users,
        sessions,
        resetTokens,
        hasher,
        mailer,
        config,
        tokens: new CryptoTokenGenerator(),
        totp: new Rfc6238Totp(),
        clock: new SystemClock(),
      }),
    },
    ...useCaseProviders,
    SessionGuard,
  ],
  exports: [AuthenticateSession, SessionGuard],
})
export class AuthModule {}
