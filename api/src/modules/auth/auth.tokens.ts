import type { AuthPolicy } from './application/auth-deps.js';

/** Nest DI tokens for the auth ports, so tests can override any adapter. */
export const AUTH_CONFIG = Symbol('AUTH_CONFIG');
export const AUTH_DEPS = Symbol('AUTH_DEPS');
export const STAFF_USER_REPOSITORY = Symbol('STAFF_USER_REPOSITORY');
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const MAILER = Symbol('MAILER');

export interface AuthConfig extends AuthPolicy {
  /** `Secure` cookie attribute; on in production. */
  secureCookies: boolean;
}
