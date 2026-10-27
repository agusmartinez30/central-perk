import type { PasswordRequirementId } from './password-policy.js';

export abstract class AuthError extends Error {
  abstract readonly code: string;
}

/** Same error for unknown email and wrong password, so accounts cannot be probed. */
export class InvalidCredentialsError extends AuthError {
  readonly code = 'invalid_credentials';
  constructor() {
    super('Invalid email or password');
  }
}

export class InvalidMfaCodeError extends AuthError {
  readonly code = 'invalid_mfa_code';
  constructor() {
    super('Invalid verification code');
  }
}

/** Missing, unknown, revoked, expired, or wrong-stage session. */
export class InvalidSessionError extends AuthError {
  readonly code = 'invalid_session';
  constructor() {
    super('Session is not valid');
  }
}

export class InvalidResetTokenError extends AuthError {
  readonly code = 'invalid_reset_token';
  constructor() {
    super('Reset link is invalid or has expired');
  }
}

export class WeakPasswordError extends AuthError {
  readonly code = 'weak_password';
  constructor(readonly unmet: PasswordRequirementId[]) {
    super('Password does not meet the requirements');
  }
}
