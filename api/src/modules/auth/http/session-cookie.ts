import type { CookieOptions, Request, Response } from 'express';
import type { IssuedSession } from '../application/auth-deps.js';
import type { AuthConfig } from '../auth.tokens.js';

export const SESSION_COOKIE = 'cp_session';

function baseOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/' };
}

export function readSessionToken(request: Request): string | null {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[SESSION_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Remembered sessions get a persistent cookie that lives as long as the server session;
 * otherwise the cookie ends with the browser session (the server TTL still applies).
 */
export function setSessionCookie(
  response: Response,
  session: IssuedSession,
  { secureCookies, sessionTtlMs }: Pick<AuthConfig, 'secureCookies' | 'sessionTtlMs'>,
): void {
  const persistent = session.remember && session.stage === 'authenticated';
  response.cookie(SESSION_COOKIE, session.token, {
    ...baseOptions(secureCookies),
    ...(persistent ? { maxAge: sessionTtlMs } : {}),
  });
}

export function clearSessionCookie(response: Response, secure: boolean): void {
  response.clearCookie(SESSION_COOKIE, baseOptions(secure));
}
