export interface PasswordResetToken {
  id: string;
  /** SHA-256 of the emailed token; the raw token is never stored. */
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export type NewPasswordResetToken = Pick<PasswordResetToken, 'tokenHash' | 'userId' | 'expiresAt'>;

export interface PasswordResetTokenRepository {
  create(data: NewPasswordResetToken): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  /** Marks the token used only if it is still unused; `false` means someone else consumed it. */
  consume(id: string, at: Date): Promise<boolean>;
}
