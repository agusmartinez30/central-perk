import { InvalidMfaCodeError, InvalidSessionError } from '../domain/auth-errors.js';
import { isSessionActive } from '../domain/session.js';
import type { AuthDeps, IssuedSession } from './auth-deps.js';
import { openSession } from './open-session.js';

/** 11D · Authenticator-app code. Replaces the pending session with a fresh authenticated one. */
export class VerifyMfa {
  constructor(private readonly deps: AuthDeps) {}

  async execute({ token, code }: { token: string; code: string }): Promise<IssuedSession> {
    const now = this.deps.clock.now();
    const pending = await this.deps.sessions.findByTokenHash(this.deps.tokens.hash(token));
    if (!pending || !isSessionActive(pending, 'mfa_pending', now)) throw new InvalidSessionError();

    const user = await this.deps.users.findById(pending.userId);
    if (!user?.mfaSecret) throw new InvalidSessionError();

    const step = this.deps.totp.verify(user.mfaSecret, code, now);
    if (step === null || step <= (user.mfaLastUsedStep ?? -1)) throw new InvalidMfaCodeError();

    await this.deps.users.recordMfaStep(user.id, step);
    await this.deps.sessions.revoke(pending.id, now);
    // A new token prevents fixation: the pre-MFA token never becomes a full session.
    return openSession(this.deps, user, 'authenticated', pending.remember);
  }
}
