import { InvalidCredentialsError } from '../domain/auth-errors.js';
import { normalizeEmail } from '../domain/staff-user.js';
import type { AuthDeps, IssuedSession } from './auth-deps.js';
import { openSession } from './open-session.js';

export interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

/** 11A · Password step. Users with an authenticator app get an `mfa_pending` session. */
export class Login {
  constructor(private readonly deps: AuthDeps) {}

  async execute({ email, password, remember }: LoginInput): Promise<IssuedSession> {
    const user = await this.deps.users.findByEmail(normalizeEmail(email));
    if (!user) {
      // Spend comparable time hashing so response timing does not reveal unknown emails.
      await this.deps.hasher.hash(password);
      throw new InvalidCredentialsError();
    }
    if (!(await this.deps.hasher.verify(user.passwordHash, password))) throw new InvalidCredentialsError();

    return openSession(this.deps, user, user.mfaSecret ? 'mfa_pending' : 'authenticated', remember);
  }
}
