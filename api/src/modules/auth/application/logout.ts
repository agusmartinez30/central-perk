import type { AuthDeps } from './auth-deps.js';

/** Revokes the session behind `token`. Idempotent: unknown tokens are ignored. */
export class Logout {
  constructor(private readonly deps: AuthDeps) {}

  async execute(token: string): Promise<void> {
    const session = await this.deps.sessions.findByTokenHash(this.deps.tokens.hash(token));
    if (session) await this.deps.sessions.revoke(session.id, this.deps.clock.now());
  }
}
