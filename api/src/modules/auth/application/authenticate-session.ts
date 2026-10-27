import { InvalidSessionError } from '../domain/auth-errors.js';
import { isSessionActive } from '../domain/session.js';
import { toStaffProfile, type StaffProfile } from '../domain/staff-user.js';
import type { AuthDeps } from './auth-deps.js';

export interface AuthenticatedStaff {
  sessionId: string;
  staff: StaffProfile;
}

/** Resolves a cookie token to the signed-in staff member; used by `SessionGuard`. */
export class AuthenticateSession {
  constructor(private readonly deps: AuthDeps) {}

  async execute(token: string): Promise<AuthenticatedStaff> {
    const now = this.deps.clock.now();
    const session = await this.deps.sessions.findByTokenHash(this.deps.tokens.hash(token));
    if (!session || !isSessionActive(session, 'authenticated', now)) throw new InvalidSessionError();

    const user = await this.deps.users.findById(session.userId);
    if (!user) throw new InvalidSessionError();

    await this.deps.sessions.touch(session.id, now);
    return { sessionId: session.id, staff: toStaffProfile(user) };
  }
}
