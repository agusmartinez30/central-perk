import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseFilters, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../../../shared/http/zod-validation.pipe.js';
import type { IssuedSession } from '../application/auth-deps.js';
import { Login } from '../application/login.js';
import { Logout } from '../application/logout.js';
import { RequestPasswordReset } from '../application/request-password-reset.js';
import { ResetPassword } from '../application/reset-password.js';
import { VerifyMfa } from '../application/verify-mfa.js';
import { InvalidSessionError } from '../domain/auth-errors.js';
import type { StaffProfile } from '../domain/staff-user.js';
import { AUTH_CONFIG, type AuthConfig } from '../auth.tokens.js';
import { AuthErrorFilter } from './auth-error.filter.js';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  verifyMfaSchema,
  type ForgotPasswordBody,
  type LoginBody,
  type ResetPasswordBody,
  type VerifyMfaBody,
} from './auth.schemas.js';
import { clearSessionCookie, readSessionToken, setSessionCookie } from './session-cookie.js';
import { CurrentStaff, SessionGuard } from './session.guard.js';

export type SessionResponse = { status: 'mfa_required' } | { status: 'authenticated'; staff: StaffProfile };

const PER_MINUTE = 60_000;

@Controller('auth')
@UseFilters(AuthErrorFilter)
export class AuthController {
  constructor(
    private readonly login: Login,
    private readonly verifyMfa: VerifyMfa,
    private readonly logout: Logout,
    private readonly requestPasswordReset: RequestPasswordReset,
    private readonly resetPassword: ResetPassword,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: PER_MINUTE } })
  async signIn(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    return this.issue(response, await this.login.execute(body));
  }

  @Post('mfa/verify')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: PER_MINUTE } })
  async verify(
    @Body(new ZodValidationPipe(verifyMfaSchema)) body: VerifyMfaBody,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const token = readSessionToken(request);
    if (!token) throw new InvalidSessionError();
    return this.issue(response, await this.verifyMfa.execute({ token, code: body.code }));
  }

  @Post('logout')
  @HttpCode(204)
  async signOut(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = readSessionToken(request);
    if (token) await this.logout.execute(token);
    clearSessionCookie(response, this.config.secureCookies);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentStaff() staff: StaffProfile): { staff: StaffProfile } {
    return { staff };
  }

  /** Always 202 with no body, whether or not the email belongs to an account. */
  @Post('password/forgot')
  @HttpCode(202)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: PER_MINUTE } })
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordBody): Promise<void> {
    await this.requestPasswordReset.execute(body.email);
  }

  @Post('password/reset')
  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: PER_MINUTE } })
  async changePassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.resetPassword.execute(body);
    // Every session was revoked, including this browser's.
    clearSessionCookie(response, this.config.secureCookies);
  }

  private issue(response: Response, session: IssuedSession): SessionResponse {
    setSessionCookie(response, session, this.config);
    return session.stage === 'mfa_pending'
      ? { status: 'mfa_required' }
      : { status: 'authenticated', staff: session.staff };
  }
}
