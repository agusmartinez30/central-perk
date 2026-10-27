import type { PasswordResetTokenRepository } from '../domain/password-reset-token.js';
import type { Session, SessionRepository } from '../domain/session.js';
import type { StaffProfile, StaffUserRepository } from '../domain/staff-user.js';
import type { Clock, Mailer, PasswordHasher, TokenGenerator, TotpVerifier } from './ports.js';

export interface AuthPolicy {
  sessionTtlMs: number;
  /** Lifetime of the half-open session between password and MFA code. */
  mfaPendingTtlMs: number;
  resetTokenTtlMs: number;
  /** Admin page that receives `?token=` from the reset email. */
  resetPasswordUrl: string;
}

/** Everything the auth use cases need, wired by `AuthModule` or by test fakes. */
export interface AuthDeps {
  users: StaffUserRepository;
  sessions: SessionRepository;
  resetTokens: PasswordResetTokenRepository;
  hasher: PasswordHasher;
  tokens: TokenGenerator;
  totp: TotpVerifier;
  mailer: Mailer;
  clock: Clock;
  config: AuthPolicy;
}

/** A session just opened: the raw token goes to the cookie and is never stored. */
export interface IssuedSession {
  token: string;
  stage: Session['stage'];
  remember: boolean;
  expiresAt: Date;
  staff: StaffProfile;
}
