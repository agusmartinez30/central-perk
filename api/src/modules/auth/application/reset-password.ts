import { InvalidResetTokenError, WeakPasswordError } from '../domain/auth-errors.js';
import { unmetPasswordRequirements } from '../domain/password-policy.js';
import type { AuthDeps } from './auth-deps.js';

/** 11C · Sets a new password from an emailed token and signs the user out everywhere. */
export class ResetPassword {
  constructor(private readonly deps: AuthDeps) {}

  async execute({ token, password }: { token: string; password: string }): Promise<void> {
    const now = this.deps.clock.now();
    const reset = await this.deps.resetTokens.findByTokenHash(this.deps.tokens.hash(token));
    if (!reset || reset.usedAt || reset.expiresAt.getTime() <= now.getTime()) throw new InvalidResetTokenError();

    const user = await this.deps.users.findById(reset.userId);
    if (!user) throw new InvalidResetTokenError();

    const unmet = unmetPasswordRequirements(password, user.email);
    if (unmet.length > 0) throw new WeakPasswordError(unmet);

    if (!(await this.deps.resetTokens.consume(reset.id, now))) throw new InvalidResetTokenError();
    await this.deps.users.updatePasswordHash(user.id, await this.deps.hasher.hash(password));
    await this.deps.sessions.revokeAllForUser(user.id, now);
  }
}
