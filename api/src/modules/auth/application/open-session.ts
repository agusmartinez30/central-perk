import type { SessionStage } from '../domain/session.js';
import { toStaffProfile, type StaffUser } from '../domain/staff-user.js';
import type { AuthDeps, IssuedSession } from './auth-deps.js';

/** Creates a session row for `user` and returns the raw token for the cookie. */
export async function openSession(
  deps: AuthDeps,
  user: StaffUser,
  stage: SessionStage,
  remember: boolean,
): Promise<IssuedSession> {
  const now = deps.clock.now();
  const ttl = stage === 'mfa_pending' ? deps.config.mfaPendingTtlMs : deps.config.sessionTtlMs;
  const token = deps.tokens.generate();
  const expiresAt = new Date(now.getTime() + ttl);
  await deps.sessions.create({ tokenHash: deps.tokens.hash(token), userId: user.id, stage, remember, expiresAt, createdAt: now });
  return { token, stage, remember, expiresAt, staff: toStaffProfile(user) };
}
