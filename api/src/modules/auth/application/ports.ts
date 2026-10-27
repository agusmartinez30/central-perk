/** Technical ports the auth use cases depend on; adapters live in `infrastructure/`. */

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export interface TokenGenerator {
  /** Unguessable opaque token (32 random bytes). */
  generate(): string;
  /** Deterministic digest stored instead of the token (SHA-256). */
  hash(token: string): string;
}

export interface TotpVerifier {
  /** Returns the matched time step, or `null` when the code is not valid around `at`. */
  verify(secret: string, code: string, at: Date): number | null;
}

export interface PasswordResetMail {
  to: string;
  name: string;
  resetUrl: string;
  expiresAt: Date;
}

export interface Mailer {
  sendPasswordReset(mail: PasswordResetMail): Promise<void>;
}

export interface Clock {
  now(): Date;
}
