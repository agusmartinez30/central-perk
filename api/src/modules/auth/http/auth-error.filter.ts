import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { AuthError, InvalidResetTokenError, WeakPasswordError } from '../domain/auth-errors.js';

/** Maps auth domain errors to HTTP: `{ statusCode, error: <code>, message, requirements? }`. */
@Catch(AuthError)
export class AuthErrorFilter implements ExceptionFilter<AuthError> {
  catch(error: AuthError, host: ArgumentsHost): void {
    const status =
      error instanceof WeakPasswordError || error instanceof InvalidResetTokenError
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.UNAUTHORIZED;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        error: error.code,
        message: error.message,
        ...(error instanceof WeakPasswordError ? { requirements: error.unmet } : {}),
      });
  }
}
