import {
  createParamDecorator,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticateSession, type AuthenticatedStaff } from '../application/authenticate-session.js';
import { InvalidSessionError } from '../domain/auth-errors.js';
import type { StaffProfile } from '../domain/staff-user.js';
import { readSessionToken } from './session-cookie.js';

export type AuthenticatedRequest = Request & { auth?: AuthenticatedStaff };

/**
 * Requires an authenticated `cp_session` cookie. Other modules import `AuthModule` and use
 * `@UseGuards(SessionGuard)` together with `@CurrentStaff()`.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authenticateSession: AuthenticateSession) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readSessionToken(request);
    try {
      if (!token) throw new InvalidSessionError();
      request.auth = await this.authenticateSession.execute(token);
      return true;
    } catch (error) {
      if (!(error instanceof InvalidSessionError)) throw error;
      throw new UnauthorizedException({ statusCode: 401, error: error.code, message: error.message });
    }
  }
}

/** Staff member resolved by `SessionGuard`. */
export const CurrentStaff = createParamDecorator((_data: unknown, context: ExecutionContext): StaffProfile => {
  const auth = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  if (!auth) throw new Error('@CurrentStaff() requires SessionGuard on the route');
  return auth.staff;
});
