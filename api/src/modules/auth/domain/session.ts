/** `mfa_pending` sessions only allow the verification step; `authenticated` ones reach the API. */
export type SessionStage = 'mfa_pending' | 'authenticated';

export interface Session {
  id: string;
  /** SHA-256 of the cookie token; the raw token is never stored. */
  tokenHash: string;
  userId: string;
  stage: SessionStage;
  /** "Recordarme en este dispositivo": the cookie outlives the browser session. */
  remember: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
  revokedAt: Date | null;
}

export type NewSession = Pick<Session, 'tokenHash' | 'userId' | 'stage' | 'remember' | 'expiresAt' | 'createdAt'>;

export function isSessionActive(session: Session, stage: SessionStage, now: Date): boolean {
  return session.stage === stage && session.revokedAt === null && session.expiresAt.getTime() > now.getTime();
}

export interface SessionRepository {
  create(data: NewSession): Promise<Session>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  touch(id: string, at: Date): Promise<void>;
  revoke(id: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}
