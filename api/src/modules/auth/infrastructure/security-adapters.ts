import { Logger } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { Clock, Mailer, PasswordHasher, PasswordResetMail, TokenGenerator } from '../application/ports.js';

/** argon2id with the library defaults (OWASP-compliant memory/time cost). */
export class Argon2PasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain);
  }

  async verify(passwordHash: string, plain: string): Promise<boolean> {
    try {
      return await verify(passwordHash, plain);
    } catch {
      // A malformed stored hash must read as "wrong password", not as a 500.
      return false;
    }
  }
}

export class CryptoTokenGenerator implements TokenGenerator {
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * Development mailer: prints the reset link to the API console. Swap for an SMTP/provider
 * adapter before production; the link is a credential, so never ship this adapter there.
 */
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger('Mailer');

  sendPasswordReset({ to, name, resetUrl, expiresAt }: PasswordResetMail): Promise<void> {
    this.logger.log(`Password reset for ${name} <${to}> (expires ${expiresAt.toISOString()}): ${resetUrl}`);
    return Promise.resolve();
  }
}
