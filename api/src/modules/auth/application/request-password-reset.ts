import { normalizeEmail } from '../domain/staff-user.js';
import type { AuthDeps } from './auth-deps.js';

/** 11B · Emails a one-time reset link. Unknown addresses are silently ignored (no probing). */
export class RequestPasswordReset {
  constructor(private readonly deps: AuthDeps) {}

  async execute(email: string): Promise<void> {
    const user = await this.deps.users.findByEmail(normalizeEmail(email));
    if (!user) return;

    const token = this.deps.tokens.generate();
    const expiresAt = new Date(this.deps.clock.now().getTime() + this.deps.config.resetTokenTtlMs);
    await this.deps.resetTokens.create({ tokenHash: this.deps.tokens.hash(token), userId: user.id, expiresAt });

    const resetUrl = new URL(this.deps.config.resetPasswordUrl);
    resetUrl.searchParams.set('token', token);
    await this.deps.mailer.sendPasswordReset({ to: user.email, name: user.name, resetUrl: resetUrl.toString(), expiresAt });
  }
}
