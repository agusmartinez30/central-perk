import type { AuthDeps } from '../../src/modules/auth/application/auth-deps.js';
import type { Clock, Mailer, PasswordHasher, PasswordResetMail, TokenGenerator, TotpVerifier } from '../../src/modules/auth/application/ports.js';
import type {
  NewPasswordResetToken,
  PasswordResetToken,
  PasswordResetTokenRepository,
} from '../../src/modules/auth/domain/password-reset-token.js';
import type { NewSession, Session, SessionRepository } from '../../src/modules/auth/domain/session.js';
import type { StaffUser, StaffUserRepository } from '../../src/modules/auth/domain/staff-user.js';

/** In-memory adapters for the auth ports, shared by unit specs and the HTTP e2e test. */

export class InMemoryStaffUsers implements StaffUserRepository {
  readonly items = new Map<string, StaffUser>();

  add(user: StaffUser): void {
    this.items.set(user.id, { ...user });
  }

  findByEmail(email: string): Promise<StaffUser | null> {
    return Promise.resolve([...this.items.values()].find((user) => user.email === email) ?? null);
  }

  findById(id: string): Promise<StaffUser | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = this.items.get(id);
    if (user) user.passwordHash = passwordHash;
    return Promise.resolve();
  }

  recordMfaStep(id: string, step: number): Promise<void> {
    const user = this.items.get(id);
    if (user) user.mfaLastUsedStep = step;
    return Promise.resolve();
  }
}

export class InMemorySessions implements SessionRepository {
  readonly items: Session[] = [];

  create(data: NewSession): Promise<Session> {
    const session: Session = { ...data, id: `session-${this.items.length + 1}`, lastUsedAt: data.createdAt, revokedAt: null };
    this.items.push(session);
    return Promise.resolve(session);
  }

  findByTokenHash(tokenHash: string): Promise<Session | null> {
    return Promise.resolve(this.items.find((session) => session.tokenHash === tokenHash) ?? null);
  }

  touch(id: string, at: Date): Promise<void> {
    const session = this.items.find((item) => item.id === id);
    if (session) session.lastUsedAt = at;
    return Promise.resolve();
  }

  revoke(id: string, at: Date): Promise<void> {
    const session = this.items.find((item) => item.id === id);
    if (session && !session.revokedAt) session.revokedAt = at;
    return Promise.resolve();
  }

  revokeAllForUser(userId: string, at: Date): Promise<void> {
    for (const session of this.items) {
      if (session.userId === userId && !session.revokedAt) session.revokedAt = at;
    }
    return Promise.resolve();
  }
}

export class InMemoryResetTokens implements PasswordResetTokenRepository {
  readonly items: PasswordResetToken[] = [];

  create(data: NewPasswordResetToken): Promise<PasswordResetToken> {
    const token: PasswordResetToken = { ...data, id: `reset-${this.items.length + 1}`, usedAt: null };
    this.items.push(token);
    return Promise.resolve(token);
  }

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return Promise.resolve(this.items.find((token) => token.tokenHash === tokenHash) ?? null);
  }

  consume(id: string, at: Date): Promise<boolean> {
    const token = this.items.find((item) => item.id === id);
    if (!token || token.usedAt) return Promise.resolve(false);
    token.usedAt = at;
    return Promise.resolve(true);
  }
}

export class FakeHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${plain}`);
  }
}

export class FakeTokens implements TokenGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `token-${this.counter}`;
  }

  hash(token: string): string {
    return `sha:${token}`;
  }
}

/** Accepts `VALID_TOTP_CODE` and reports the current 30-second step. */
export const VALID_TOTP_CODE = '123456';

export class FakeTotp implements TotpVerifier {
  verify(_secret: string, code: string, at: Date): number | null {
    return code === VALID_TOTP_CODE ? Math.floor(at.getTime() / 30_000) : null;
  }
}

export class FakeMailer implements Mailer {
  readonly sent: PasswordResetMail[] = [];

  sendPasswordReset(mail: PasswordResetMail): Promise<void> {
    this.sent.push(mail);
    return Promise.resolve();
  }
}

export class FakeClock implements Clock {
  constructor(public current = new Date('2026-10-26T12:00:00Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export const STRONG_PASSWORD = 'Mostrador de la noche larga';

export function staffUser(overrides: Partial<StaffUser> = {}): StaffUser {
  return {
    id: 'staff-1',
    email: 'turno@cafecentral.com',
    name: 'Sofía M.',
    role: 'OWNER',
    passwordHash: `hashed:${STRONG_PASSWORD}`,
    mfaSecret: null,
    mfaLastUsedStep: null,
    ...overrides,
  };
}

export function createAuthDeps() {
  const deps = {
    users: new InMemoryStaffUsers(),
    sessions: new InMemorySessions(),
    resetTokens: new InMemoryResetTokens(),
    hasher: new FakeHasher(),
    tokens: new FakeTokens(),
    totp: new FakeTotp(),
    mailer: new FakeMailer(),
    clock: new FakeClock(),
    config: {
      sessionTtlMs: 12 * 60 * 60 * 1000,
      mfaPendingTtlMs: 10 * 60 * 1000,
      resetTokenTtlMs: 15 * 60 * 1000,
      resetPasswordUrl: 'http://admin.test/reset-password',
    },
  } satisfies AuthDeps;
  return deps;
}
